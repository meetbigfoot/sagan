import fs from 'fs'
import fetch from 'node-fetch'

import data from './data.json' assert { type: 'json' }
import logs from './logs.json' assert { type: 'json' }

const targets = {
  areas: 12,
  cities: 60,
  per_request: 6,
  plans: 12,
}

const histories = {
  areas: [
    {
      role: 'system',
      content: `You are helping me generate a large JSON file.`,
    },
  ],
  cities: [
    {
      role: 'system',
      content: `You are helping me generate a large JSON file.`,
    },
  ],
  plans: [
    {
      role: 'system',
      content: `You are helping me generate a large JSON file.`,
    },
  ],
}

const schemas = {
  first: {
    cities: [
      {
        name: 'London',
        description: 'what this city is known for',
        language: 'native language spoken',
      },
    ],
  },
  areas: {
    areas: [
      {
        name: 'local area name',
        description: 'what this area is known for',
      },
    ],
  },
  plans: {
    plans: [
      {
        title: 'a fun title using emojis',
        parts: [
          {
            time_of_day: 'morning',
            places: [
              {
                name: 'Example',
                address: 'Example',
                latitude: 12.34,
                longitude: -56.78,
                tags: 'comma-separated list of three descriptors',
              },
            ],
          },
        ],
      },
    ],
  },
}

const turbo = async messages => {
  const response = await fetch(`https://us-central1-samantha-374622.cloudfunctions.net/turbo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })
  return response.text()
}

const toJSON = str => {
  const curly = str.indexOf('{')
  const square = str.indexOf('[')
  let first
  if (curly < 0) first = '[' // only for empty arrays
  else if (square < 0) first = '{'
  else first = curly < square ? '{' : '['
  const last = first === '{' ? '}' : ']'
  // ensure JSON is complete
  let count = 0
  for (const c of str) {
    if (c === '{' || c === '[') count++
    else if (c === '}' || c === ']') count--
  }
  if (!count) return JSON.parse(str.slice(str.indexOf(first), str.lastIndexOf(last) + 1))
}

const addCities = () => {
  const cities = data.cities.map(c => c.name).join(', ')
  const schema = JSON.stringify(schemas.first, null, 0)
  let started_at = Date.now()
  histories.cities.push({
    role: 'user',
    content: `I want info on ${targets.per_request} more cool cities besides ${cities}. Return a single JSON object copying this schema: ${schema} and use the values as hints.`,
  })
  // console.log(histories.cities.at(-1))
  turbo(histories.cities).then(text => {
    try {
      const newCities = toJSON(text).cities
      histories.cities.push({
        role: 'assistant',
        content: text,
      })
      newCities.forEach(city => {
        // skip dupes
        if (!data.cities.some(c => c.name === city.name)) data.cities.push(city)
      })
      saveData()
      log(Date.now() - started_at, `Added ${newCities.map(c => c.name).join(', ')}`)
    } catch (error) {
      console.log(text)
      log(Date.now() - started_at, `Error adding cities: ${error}`)
    }
    // AutoGPT
    if (data.cities.length < targets.cities) addCities()
    // while that runs, start next task
  })
}
// addCities()

const log = (duration, event) => {
  logs.push({
    duration,
    event,
    model: 'turbo',
    stats: {
      total_cities: data.cities.length,
    },
    time: Date.now(),
  })
  fs.writeFileSync('logs.json', JSON.stringify(logs, null, 2))
}
log(0, 'Init AutoGPT')

const saveData = () => fs.writeFileSync('data.json', JSON.stringify(data, null, 2))

const addAreas = () => {
  const schema = JSON.stringify(schemas.areas, null, 0)
  let started_at = Date.now()

  // continue where we left off
  const nextCity = data.cities.findIndex(city => city.areas.length < targets.areas)
  const city = data.cities[nextCity]
  // reset history when city changes
  if (!city.areas.length) histories.areas.length = 1

  histories.areas.push({
    role: 'user',
    content: `Add ${targets.per_request} more top local areas in ${city.name} where there are many things to do. Return a single JSON object copying this schema: ${schema} and use the values as hints.`,
  })
  // console.log(histories.areas.at(-1))
  turbo(histories.areas).then(text => {
    try {
      histories.areas.push({
        role: 'assistant',
        content: text,
      })
      const newAreas = toJSON(text).areas
      newAreas.forEach(area => {
        // ignore dupes
        if (!city.areas.some(a => a.name === area.name)) city.areas.push(area)
      })
      saveData()
      log(Date.now() - started_at, `Added ${newAreas.map(a => a.name).join(', ')}`)
      // keep going! TODO: detect all area targets met
      addAreas()
    } catch (error) {
      console.log(text)
      log(Date.now() - started_at, `Error adding areas: ${error}`)
    }
  })
}
// addAreas()

const addPlans = () => {
  const schema = JSON.stringify(schemas.areas, null, 0)
  let started_at = Date.now()

  // continue where we left off
  const nextCity = data.cities.findIndex(city => city.areas.find(area => area.plans.length < targets.plans))
  const city = data.cities[nextCity]
  const nextArea = city.areas.findIndex(area => area.plans.length < targets.plans)
  const area = city.areas[nextArea]
  // reset history when area changes
  if (!area.plans.length) histories.plans.length = 1

  histories.plans.push({
    role: 'user',
    content: `Plan another full day of experiences in ${area.name} in ${
      city.name
    }. Return a single JSON object copying this schema: ${JSON.stringify(
      schemas.plans,
    )}, use the values as hints, and only one or two recommendations per time of day.`,
  })
  console.log(histories.plans)
  turbo(histories.plans).then(text => {
    try {
      histories.plans.push({
        role: 'assistant',
        content: text,
      })
      const newPlans = toJSON(text).plans
      newPlans.forEach(plan => area.plans.push(plan))
      saveData()
      log(Date.now() - started_at, `Added ${newPlans.map(p => p.title).join(', ')}`)
      // keep going! TODO: detect all area targets met
      addPlans()
    } catch (error) {
      console.log(text)
      log(Date.now() - started_at, `Error adding areas: ${error}`)
    }
  })
}
addPlans()
