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

const renderPlan = () => {
  const stage = document.createElement('div')
  stage.id = 'stage'
  stage.addEventListener('click', e => {
    document.body.style.overflow = 'unset'
    stage.remove()
  })
  document.body.appendChild(stage)
  document.body.style.overflow = 'hidden'

  const frame = document.createElement('div')
  frame.className = 'iphone-14'
  frame.textContent = 'slideshow goes here'
  stage.appendChild(frame)
}
