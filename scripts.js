const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

dayjs.extend(dayjs_plugin_relativeTime)

const app = firebase.initializeApp({
  apiKey: 'AIzaSyDF5S92g7onrFBt18mEqeBYzYAXKhxCydk',
  authDomain: 'bigfoot-auth-demo.firebaseapp.com',
  databaseURL: 'https://bigfoot-auth-demo-default-rtdb.firebaseio.com',
  projectId: 'bigfoot-auth-demo',
  storageBucket: 'bigfoot-auth-demo.appspot.com',
  messagingSenderId: '462881533517',
  appId: '1:462881533517:web:344c270faac0f6d086f604',
  measurementId: 'G-S2PJ5C3T0C',
})
// Firebase Analytics is automatically initialized
const auth = firebase.auth()

const database = firebase.database()
// const saveData = data => {
//   database
//     .ref()
//     .set(data)
//     .then(() => console.log('Data written to Realtime Database successfully!'))
//     .catch(error => console.error('Error writing data to Realtime Database:', error))
// }

const url = location.host.startsWith('l') ? '' : '/sagan'

fetch(`${url}/logs.json`)
  .then(response => response.json())
  .then(data =>
    data.reverse().forEach(l => {
      const log = document.createElement('div')
      log.className = [
        'log',
        l.event.startsWith('Edit') ? 'edit' : null,
        l.event.startsWith('Error') ? 'error' : null,
      ].join(' ')

      const h2 = document.createElement('h2')
      h2.textContent = l.event
      log.appendChild(h2)

      const d = document.createElement('div')
      d.textContent = `${Math.round(l.duration / 1000)}s`
      log.appendChild(d)

      if (l.stats) {
        const s = document.createElement('div')
        s.textContent = `${l.stats.total_cities} cities`
        log.appendChild(s)
      }

      const t = document.createElement('div')
      t.className = 'log-time'
      t.textContent = dayjs(l.time).fromNow()
      log.appendChild(t)

      g('logs').appendChild(log)
    }),
  )

g('logs-header').addEventListener('click', e => g('logs').remove())

let cache

database.ref().on('value', snapshot => {
  const data = snapshot.val()
  cache = data
  renderCities(data)
})

const renderCities = data => {
  g('actions').innerHTML = ''
  g('cards').innerHTML = ''
  resetBreadcrumbs()
  data.cities.forEach(city => {
    const card = document.createElement('div')
    card.className = 'card'
    card.addEventListener('click', e => renderAreas(city))

    const h2 = document.createElement('h2')
    h2.className = 'card-name'
    h2.textContent = city.name
    card.appendChild(h2)

    const desc = document.createElement('p')
    desc.className = 'card-desc'
    desc.textContent = city.description
    card.appendChild(desc)

    const langs = document.createElement('div')
    langs.className = 'card-langs'
    card.appendChild(langs)
    city.language.split(', ').forEach(l => {
      const lang = document.createElement('div')
      lang.className = 'card-lang'
      lang.textContent = l
      langs.appendChild(lang)
    })

    g('cards').appendChild(card)
    animateCards()
  })
}

const resetBreadcrumbs = () => {
  const breadcrumb = document.createElement('div')
  breadcrumb.className = 'breadcrumb'
  breadcrumb.textContent = 'Cities'
  breadcrumb.addEventListener('click', e => renderCities(cache))
  g('breadcrumbs').innerHTML = ''
  g('breadcrumbs').appendChild(breadcrumb)
}

const animateCards = () => {
  ScrollReveal().reveal('.card', {
    cleanup: true,
    distance: '20%',
    interval: 50,
    origin: 'bottom',
  })
}

const renderAreas = city => {
  g('cards').innerHTML = ''

  const breadcrumb = document.createElement('div')
  breadcrumb.className = 'breadcrumb'
  breadcrumb.textContent = city.name
  g('breadcrumbs').appendChild(breadcrumb)

  city.areas.forEach(area => {
    const card = document.createElement('div')
    card.className = 'card'
    card.addEventListener('click', e => renderPlans(area, city))

    const h2 = document.createElement('h2')
    h2.className = 'card-name'
    h2.textContent = area.name
    card.appendChild(h2)

    const desc = document.createElement('p')
    desc.className = 'card-desc'
    desc.textContent = area.description
    card.appendChild(desc)

    g('cards').appendChild(card)
    animateCards()
  })
}

const renderPlans = (area, city) => {
  g('cards').innerHTML = ''

  const breadcrumb = document.createElement('div')
  breadcrumb.className = 'breadcrumb'
  breadcrumb.textContent = area.name
  g('breadcrumbs').appendChild(breadcrumb)

  const generate = document.createElement('button')
  generate.textContent = 'Generate new plan for this area'
  generate.addEventListener('click', e => {
    // double loop #shoelace
    database
      .ref('cities')
      .orderByChild('name')
      .equalTo(city.name)
      .once('value')
      .then(citySnapshot => {
        const cityKey = Object.keys(citySnapshot.val())[0]
        database
          .ref(`cities/${cityKey}/areas`)
          .orderByChild('name')
          .equalTo(area.name)
          .once('value')
          .then(areas => {
            const areaKey = Object.keys(areas.val())[0]
            areas.forEach(areaSnapshot => {
              const areaRef = database.ref(`cities/${cityKey}/areas/${areaKey}`)
              const plansRef = areaRef.child('plans')

              plansRef.once('value').then(plansSnapshot => {
                generate.disabled = true
                generate.textContent = 'Generating new plan…'
                try {
                  turbo([
                    {
                      role: 'system',
                      content: `You are helping me generate a large JSON file.`,
                    },
                    {
                      role: 'user',
                      content: `Plan another full day of experiences in ${area.name} in ${
                        city.name
                      }. Return a single JSON object copying this schema: ${JSON.stringify({
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
                      })}, use the values as hints, and only one or two recommendations per time of day.`,
                    },
                  ]).then(text => {
                    const json = toJSON(text)
                    if (!plansSnapshot.exists()) areaRef.update({ plans: json.plans })
                    else {
                      const plansArray = plansSnapshot.val()
                      json.plans.forEach(plan => plansArray.push(plan))
                      plansRef.set(plansArray)
                    }
                    generate.disabled = false
                    generate.textContent = 'Generate new plan for this area'
                  })
                } catch (error) {
                  g('error').textContent = error
                }
              })
            })
          })
          .catch(error => console.error('Error updating plans:', error))
      })
  })
  g('actions').appendChild(generate)

  area.plans
    ? area.plans.forEach(plan => {
        console.log(plan)
        const card = document.createElement('div')
        card.className = 'card plan'
        card.addEventListener('click', e => renderPlan(plan))

        const h2 = document.createElement('h2')
        h2.className = 'card-name'
        h2.textContent = plan.title
        card.appendChild(h2)

        let places = []
        plan.parts.forEach(part => part.places.map(place => places.push(place.name)))

        const desc = document.createElement('p')
        desc.className = 'card-desc'
        desc.textContent = places.join(' / ')
        card.appendChild(desc)

        g('cards').appendChild(card)
        animateCards()
      })
    : renderEmpty(city, area)
}

const renderPlan = plan => {
  const stage = document.createElement('div')
  stage.id = 'stage'
  stage.style.top = `${window.scrollY}px`
  stage.addEventListener('click', e => {
    document.body.style.overflow = 'unset'
    stage.remove()
  })
  document.body.appendChild(stage)
  document.body.style.overflow = 'hidden'

  const close = document.createElement('i')
  close.className = 'fa-solid fa-circle-xmark'
  stage.appendChild(close)

  const story = document.createElement('div')
  story.id = 'story'
  story.addEventListener('click', e => e.stopPropagation())
  stage.appendChild(story)

  // cover
  const cover = document.createElement('div')
  cover.className = 'story'
  cover.id = 'cover'
  story.appendChild(cover)

  const h1 = document.createElement('h1')
  h1.className = 'card-name'
  h1.textContent = plan.title
  cover.appendChild(h1)

  let places = []
  plan.parts.forEach(part => part.places.map(place => places.push(place.name)))

  const desc = document.createElement('p')
  desc.className = 'card-desc'
  desc.textContent = places.join(' / ')
  cover.appendChild(desc)

  // plan
  const list = document.createElement('div')
  list.className = 'story'
  list.id = 'list'
  story.appendChild(list)

  plan.parts.forEach(part => {
    const group = document.createElement('div')
    group.className = 'plan-group'

    const time = document.createElement('div')
    time.className = 'plan-time-of-day'
    time.textContent = part.time_of_day
    group.appendChild(time)

    const stack = document.createElement('div')
    stack.className = 'plan-stack'
    part.places.forEach(spot => {
      spot.time_of_day = part.time_of_day

      const place = document.createElement('div')
      place.className = 'plan-place'

      const name = document.createElement('h2')
      name.className = 'plan-name'
      name.textContent = spot.name
      place.appendChild(name)

      const reason = document.createElement('div')
      reason.className = 'plan-reason'
      reason.textContent = 'reason missing'
      place.appendChild(reason)
      stack.appendChild(place)
    })
    group.appendChild(stack)
    list.appendChild(group)
  })

  // map
  const map = document.createElement('div')
  map.className = 'story'
  map.id = 'map'
  story.appendChild(map)

  let spots = []
  plan.parts.forEach(part => part.places.forEach(spot => spots.push(spot)))

  console.log(spots[0])

  mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGJvcm4iLCJhIjoiY2w1Ym0wbHZwMDh3eTNlbnh1aW51cm0ydyJ9.Z5h4Vkk8zqjf6JydrOGXGA'
  const mapbox = new mapboxgl.Map({
    center: [spots[0].longitude, spots[0].latitude],
    container: map,
    style: 'mapbox://styles/mapbox/streets-v12',
    zoom: 14,
  })
  spots.forEach(spot => {
    const marker = document.createElement('div')
    marker.className = 'marker'
    const icon = document.createElement('i')
    icon.className = `fa-solid fa-location-dot`
    marker.appendChild(icon)
    new mapboxgl.Marker(marker).setLngLat([spot.longitude, spot.latitude]).addTo(mapbox)
  })

  // story
  spots.forEach(spot => {
    const place = document.createElement('div')
    place.className = 'story place'

    const group = document.createElement('div')
    group.className = 'plan-group'
    const time = document.createElement('div')
    time.className = 'plan-time-of-day'
    time.textContent = spot.time_of_day
    group.appendChild(time)
    const stack = document.createElement('div')
    stack.className = 'plan-stack'
    const name = document.createElement('h2')
    name.className = 'plan-name'
    name.textContent = spot.name
    stack.appendChild(name)
    const reason = document.createElement('div')
    reason.className = 'plan-reason'
    reason.textContent = 'missing reason'
    stack.appendChild(reason)

    group.appendChild(stack)
    place.appendChild(group)

    story.appendChild(place)
  })

  // progress
  const progress = document.createElement('div')
  progress.id = 'progress'
  story.appendChild(progress)

  const children = Array.from(story.childNodes).slice(0, -1)
  children.forEach((child, i) => {
    const segment = document.createElement('div')
    segment.className = ['progress-segment'].join(' ')
    progress.appendChild(segment)
  })

  // controls
  let current = 0

  const next = document.createElement('div')
  next.id = 'next'
  next.addEventListener('click', e => {
    if (current < children.length - 1) current++
    children[current].style.zIndex = 2
    const bars = Array.from(progress.childNodes)
    bars[current].classList.add('active')
    bars[current - 1].classList.remove('active')
    bars[current - 1].classList.add('seen')
  })
  story.appendChild(next)
}

// admin

const turbo = async messages => {
  g('cards').innerHTML = 'Loading…'
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

const renderEmpty = (city, area) => {
  g('cards').innerHTML = ''

  const note = document.createElement('h2')
  note.textContent = 'Be the first to create a plan for this area!'
  g('cards').appendChild(note)
}
