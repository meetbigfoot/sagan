import fs from 'fs'

import data from './data.json' assert { type: 'json' }
import logs from './logs.json' assert { type: 'json' }

const targets = {
  areas: 12,
  cities: 12,
}

const histories = {
  cities: [
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
    content: `I want info on 3 more cool cities besides ${cities}. Return a JSON object copying this schema: ${schema} and use the values as hints.`,
  })
  console.log(histories.cities.at(-1))
  turbo(histories.cities).then(text => {
    histories.cities.push({
      role: 'assistant',
      content: text,
    })
    const newCities = toJSON(text).cities
    newCities.forEach(city => {
      // ignore dupes
      if (!data.cities.some(c => c.name === city.name)) data.cities.push(city)
    })
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2))
    log(Date.now() - started_at, `Added ${newCities.map(c => c.name).join(', ')}`)

    // AutoGPT
    if (data.cities.length < targets.cities) addCities()
    // while that runs, start next task
  })
}
addCities()

const log = (duration, event) => {
  logs.push({
    duration,
    event,
    stats: {
      total_cities: data.cities.length,
    },
    time: Date.now(),
  })
  fs.writeFileSync('logs.json', JSON.stringify(logs, null, 2))
}
log(0, 'Init AutoGPT')
