# Project Sagan

> “If you wish to make an apple pie from scratch, you must first invent the universe.”

## Inspired by AutoGPT

Rough idea:

- Use GPT to generate a flatfile for all pre-generated site content
- Start with canonical hierarchy — for us, that’s cities and named areas within cities
- Structure subsequent requests to be additive and infinitely extensible
- Attempt to generate at least 14 days worth of daily plans for each area
- Attempt to use event venues with upcoming events as the centerpiece for those plans
- Generate intuitive logs that tell a good story while we’re at it

## Getting started

```
npm i
```

## Usage

To generate the `data.json` flatfile:

```
node index.js
```
