"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Button } from "@repo/ui/components/ui/button"
import CodeViewer from './CodeViewer'
import ChainVisualization from './ChainVisualization'

interface AnalysisData {
  Function: string
  Vulnerability: string
  'Severity Score': number
  'Analysis/Reason of Vulnerability': string
  'PoC code': string
  chain: string[][]
  file_name: string
}

export default function AnalysisTable({ data }: { data: AnalysisData[] }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [selectedChain, setSelectedChain] = useState<string[][] | null>(null)

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Function</TableHead>
            <TableHead>Vulnerability</TableHead>
            <TableHead>Severity Score</TableHead>
            <TableHead>Analysis/Reason</TableHead>
            <TableHead>PoC Code</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>File Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.Function}</TableCell>
              <TableCell>{row.Vulnerability}</TableCell>
              <TableCell>{row['Severity Score']}</TableCell>
              <TableCell>{row['Analysis/Reason of Vulnerability']}</TableCell>
              <TableCell>
                <Button onClick={() => setSelectedCode(row['PoC code'])}>
                  View Code
                </Button>
              </TableCell>
              <TableCell>
                {row.chain.length > 0 ? (
                  <Button onClick={() => setSelectedChain(row.chain)}>
                    View Chain
                  </Button>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>{row.file_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedCode && (
        <CodeViewer code={selectedCode} onClose={() => setSelectedCode(null)} />
      )}
      {selectedChain && (
        <ChainVisualization chain={selectedChain} onClose={() => setSelectedChain(null)} />
      )}
    </div>
  )
}

