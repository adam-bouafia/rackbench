export const SITE = {
  name: 'rackbench',
  title: 'Rackbench',
  tagline: 'A data center rack, from order to shipping',
  /** This site's source. */
  repo: 'https://github.com/adam-bouafia/rackbench',
  /** The lab scripts the lessons are built on. */
  labRepo: 'https://github.com/adam-bouafia/rackbench-lab',
  author: 'Adam Bouafia',
  authorUrl: 'https://adam-bouafia.github.io',
}

/** Link to a file of the lab scripts in the rackbench-lab repository. */
export const labFile = (file: string) => `${SITE.labRepo}/blob/main/lab/${file}`
