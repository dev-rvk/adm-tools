'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"

type Transaction = {
  id: number
  amount: number
  bank: string
  date: string
}

export function TransactionPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !selectedBank) return

    const newTransaction: Transaction = {
      id: Date.now(),
      amount: parseFloat(amount),
      bank: selectedBank,
      date: new Date().toLocaleString()
    }

    setTransactions(prev => [newTransaction, ...prev])
    setBalance(prev => prev + newTransaction.amount)
    setAmount('')
    setSelectedBank('')
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Transaction Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bank">Select Bank</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Select a bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank1">Bank 1</SelectItem>
                    <SelectItem value="bank2">Bank 2</SelectItem>
                    <SelectItem value="bank3">Bank 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <PlusIcon className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500">No transactions yet</p>
          ) : (
            <ul className="space-y-4">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-semibold">{transaction.bank}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                  <p className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${transaction.amount.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}