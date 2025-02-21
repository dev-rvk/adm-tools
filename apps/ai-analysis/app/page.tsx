import AnalysisTable from '../components/AnalysisTable'
import { analysisData } from '../lib/data'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Analysis Report</h1>
      <AnalysisTable data={analysisData} />
    </main>
  )
}

