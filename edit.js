import fs from 'fs'

/* for quick and dirty edits */

import data from './data.json' assert { type: 'json' }
import logs from './logs.json' assert { type: 'json' }

/* add empty areas key to each city

data.cities.map(city => {
  city.areas = []
  return city
})

logs.push({
  duration: 0,
  event: 'Edit: add empty areas key to each city',
  time: Date.now(),
})

STATUS: worked, don’t run this block again */

fs.writeFileSync('data.json', JSON.stringify(data, null, 2))
fs.writeFileSync('logs.json', JSON.stringify(logs, null, 2))
