const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

dayjs.extend(dayjs_plugin_relativeTime)

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

let state

fetch(`${url}/data.json`)
  .then(response => response.json())
  .then(data => {
    state = data
    renderCities(data)
  })

const renderCities = data => {
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
  breadcrumb.addEventListener('click', e => renderCities(state))
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
    card.addEventListener('click', e => renderPlans(area))

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

const renderPlans = area => {
  g('cards').innerHTML = ''

  const breadcrumb = document.createElement('div')
  breadcrumb.className = 'breadcrumb'
  breadcrumb.textContent = area.name
  g('breadcrumbs').appendChild(breadcrumb)

  area.plans.length
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
    : renderEmpty()
}

const renderEmpty = () => {
  g('cards').innerHTML = '<div>Be the first to create a plan for this area! <button>Generate</button></div>'
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
  children.forEach(child => {
    const segment = document.createElement('div')
    segment.className = 'progress-segment'
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
