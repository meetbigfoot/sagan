import fs from 'fs'

import data from './data.json' assert { type: 'json' }
import logs from './logs.json' assert { type: 'json' }

let history = [
  {
    role: 'system',
    content: `You are helping me generate a large JSON file.`,
  },
]

let schemas = [
  {
    cities: [
      {
        name: 'city name',
        description: 'what this city is known for',
        language: 'native language spoken',
      },
    ],
  },
]

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

// seed cities
history.push({
  role: 'user',
  content: `Get info on 3 amazing cities. Return a JSON object copying this schema: ${JSON.stringify(
    schemas[0],
  )} and use the values as hints.`,
})
turbo(history).then(text => {
  console.log(text)
  history.push({
    role: 'assistant',
    content: text,
  })
  data.cities = toJSON(text)
  fs.writeFileSync('data.json', JSON.stringify(data))
})

fs.writeFileSync('logs.json', JSON.stringify(logs))
