export const SITE = {
  name: 'rackbench',
  title: 'Rackbench Explorer',
  tagline: 'A server rack on your laptop, made visible',
  /** This site's source. */
  repo: 'https://github.com/adam-bouafia/rackbench-explorer',
  /** The lab scripts the lessons are built on. */
  labRepo: 'https://github.com/adam-bouafia/rackbench',
  author: 'Adam Bouafia',
  authorUrl: 'https://adam-bouafia.github.io',
}

/** Link to a file of the lab scripts in the rackbench repository. */
export const labFile = (file: string) => `${SITE.labRepo}/blob/main/lab/${file}`
