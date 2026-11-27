import { useEffect, useState } from 'react'

// Interface strings. The lesson texts are English; the language switch changes the interface.
export type Lang = 'en' | 'fr' | 'nl'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'nl', label: 'Nederlands' },
]

const en = {
  packets: 'Packets',
  time: 'Time',
  source: 'Source',
  destination: 'Destination',
  protocol: 'Protocol',
  pktNote: 'Times are illustrative; click a row to jump to that step.',
  hideCourse: 'Hide or show the course',
  diagramOnly: 'Diagram only',
  fullscreen: 'Full screen',
  shortcuts: 'Keyboard shortcuts',
  close: 'Close',
  learn: 'Learn',
  practice: 'Practice',
  lab: 'Rack Lab',
  cheatsheets: 'Cheatsheets',
  toolbox: 'Toolbox',
  search: 'Search lessons and commands…',
  noResults: 'Nothing matches.',
  course: 'Course',
  lessons: 'lessons',
  progress: 'Progress',
  lesson: 'Lesson',
  of: 'of',
  step: 'Step',
  steps: 'steps',
  min: 'min',
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  back: 'Back',
  next: 'Next',
  start: 'Start',
  finish: 'Finished',
  replay: 'Replay',
  pause: 'Pause',
  play: 'Play',
  inThisLesson: 'In this lesson',
  youllLearn: "You'll learn",
  whatChanged: 'What changed',
  keyIdea: 'Key idea',
  details: 'Fields and raw data',
  tryIt: 'Try it on rackbench',
  diagram: 'Diagram',
  sequence: 'Sequence',
  startHere: 'Start here',
  overview: 'Overview',
  builtBy: 'built by',
  labRepo: 'Lab on GitHub',
  about: 'About this lesson',
  englishOnly: 'Lesson texts are in English.',
  tag_goal: 'Goal',
  tag_message: 'Message',
  tag_action: 'Action',
  tag_event: 'Event',
  tag_result: 'Result',
  tag_technique: 'Technique',
  rackShift: 'Rack Shift',
  faultHunt: 'Fault hunt',
  quiz: 'Quiz',
  done: 'done',
}

export type Key = keyof typeof en

const fr: Record<Key, string> = {
  packets: 'Paquets',
  time: 'Temps',
  source: 'Source',
  destination: 'Destination',
  protocol: 'Protocole',
  pktNote: 'Les temps sont indicatifs ; cliquez une ligne pour aller à cette étape.',
  hideCourse: 'Masquer ou afficher le cours',
  diagramOnly: 'Schéma seul',
  fullscreen: 'Plein écran',
  shortcuts: 'Raccourcis clavier',
  close: 'Fermer',
  learn: 'Apprendre',
  practice: 'Pratique',
  lab: 'Rack Lab',
  cheatsheets: 'Aide-mémoire',
  toolbox: 'Outils',
  search: 'Chercher leçons et commandes…',
  noResults: 'Aucun résultat.',
  course: 'Cours',
  lessons: 'leçons',
  progress: 'Progression',
  lesson: 'Leçon',
  of: 'sur',
  step: 'Étape',
  steps: 'étapes',
  min: 'min',
  Beginner: 'Débutant',
  Intermediate: 'Intermédiaire',
  back: 'Retour',
  next: 'Suivant',
  start: 'Commencer',
  finish: 'Terminé',
  replay: 'Rejouer',
  pause: 'Pause',
  play: 'Lecture',
  inThisLesson: 'Dans cette leçon',
  youllLearn: 'Vous apprendrez',
  whatChanged: 'Ce qui a changé',
  keyIdea: 'Idée clé',
  details: 'Champs et données brutes',
  tryIt: 'Essayer sur rackbench',
  diagram: 'Schéma',
  sequence: 'Séquence',
  startHere: 'Commencer ici',
  overview: 'Vue d’ensemble',
  builtBy: 'réalisé par',
  labRepo: 'Le lab sur GitHub',
  about: 'À propos de cette leçon',
  englishOnly: 'Les textes des leçons sont en anglais.',
  tag_goal: 'Objectif',
  tag_message: 'Message',
  tag_action: 'Action',
  tag_event: 'Événement',
  tag_result: 'Résultat',
  tag_technique: 'Technique',
  rackShift: 'Rack Shift',
  faultHunt: 'Chasse aux pannes',
  quiz: 'Quiz',
  done: 'terminé',
}

const nl: Record<Key, string> = {
  packets: 'Pakketten',
  time: 'Tijd',
  source: 'Bron',
  destination: 'Bestemming',
  protocol: 'Protocol',
  pktNote: 'De tijden zijn indicatief; klik op een rij om naar die stap te gaan.',
  hideCourse: 'Cursus tonen of verbergen',
  diagramOnly: 'Alleen schema',
  fullscreen: 'Volledig scherm',
  shortcuts: 'Sneltoetsen',
  close: 'Sluiten',
  learn: 'Leren',
  practice: 'Oefenen',
  lab: 'Rack Lab',
  cheatsheets: 'Spiekbriefjes',
  toolbox: 'Gereedschap',
  search: 'Zoek lessen en commando’s…',
  noResults: 'Niets gevonden.',
  course: 'Cursus',
  lessons: 'lessen',
  progress: 'Voortgang',
  lesson: 'Les',
  of: 'van',
  step: 'Stap',
  steps: 'stappen',
  min: 'min',
  Beginner: 'Beginner',
  Intermediate: 'Gevorderd',
  back: 'Terug',
  next: 'Volgende',
  start: 'Beginnen',
  finish: 'Klaar',
  replay: 'Opnieuw',
  pause: 'Pauze',
  play: 'Afspelen',
  inThisLesson: 'In deze les',
  youllLearn: 'Je leert',
  whatChanged: 'Wat er veranderde',
  keyIdea: 'Kernidee',
  details: 'Velden en ruwe data',
  tryIt: 'Probeer het op rackbench',
  diagram: 'Schema',
  sequence: 'Volgorde',
  startHere: 'Begin hier',
  overview: 'Overzicht',
  builtBy: 'gemaakt door',
  labRepo: 'Lab op GitHub',
  about: 'Over deze les',
  englishOnly: 'De lesteksten zijn in het Engels.',
  tag_goal: 'Doel',
  tag_message: 'Bericht',
  tag_action: 'Actie',
  tag_event: 'Gebeurtenis',
  tag_result: 'Resultaat',
  tag_technique: 'Techniek',
  rackShift: 'Rack Shift',
  faultHunt: 'Storingsjacht',
  quiz: 'Quiz',
  done: 'klaar',
}

const DICT: Record<Lang, Record<Key, string>> = { en, fr, nl }
const KEY = 'rackbench:lang'
const listeners = new Set<() => void>()

function read(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'en' || v === 'fr' || v === 'nl') return v
  } catch {
    /* ignore */
  }
  return 'en'
}
let current: Lang = read()

export function setLang(l: Lang) {
  current = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = l
  listeners.forEach((f) => f())
}

export function useLang(): Lang {
  const [l, setL] = useState(current)
  useEffect(() => {
    const f = () => setL(current)
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])
  return l
}

export function useT() {
  const l = useLang()
  return (k: Key) => DICT[l][k] ?? en[k]
}
