"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Check, Copy } from 'lucide-react'

interface CodeViewerProps {
  code: string
  onClose: () => void
}

export default function CodeViewer({ code, onClose }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>PoC Code</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{code}</code>
          </pre>
          <Button
            className="absolute top-2 right-2"
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

