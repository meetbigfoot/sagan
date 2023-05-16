const g = document.getElementById.bind(document)
const q = document.querySelectorAll.bind(document)

dayjs.extend(dayjs_plugin_relativeTime)

fetch('/logs.json')
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
