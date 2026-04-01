export type FeatureMetric = {
  label: string
  value: string
}

export type FeatureDefinition = {
  key: string
  route: string
  title: string
  badge?: string
  description: string
  summary?: FeatureMetric[]
  highlights: string[]
  resources: string[]
  entities: string[]
  nextMilestones: string[]
}