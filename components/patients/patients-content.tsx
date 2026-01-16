"use client"

import { useState } from "react"
import { Search, Filter, Plus, MoreHorizontal, Phone, Mail, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PatientSheet } from "./patient-sheet"

const patients = [
  {
    id: "1",
    name: "María García",
    phone: "+52 55 1234 5678",
    email: "maria.garcia@email.com",
    status: "Active",
    lastVisit: "Jan 8, 2026",
    lastVisitType: "Root Canal",
    ltv: 2450,
    avatar: "MG",
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    phone: "+52 55 2345 6789",
    email: "carlos.r@email.com",
    status: "Active",
    lastVisit: "Jan 5, 2026",
    lastVisitType: "Cleaning",
    ltv: 890,
    avatar: "CR",
  },
  {
    id: "3",
    name: "Ana Martínez",
    phone: "+52 55 3456 7890",
    email: "ana.mtz@email.com",
    status: "No-Show Risk",
    lastVisit: "Nov 12, 2025",
    lastVisitType: "Checkup",
    ltv: 1250,
    avatar: "AM",
  },
  {
    id: "4",
    name: "Roberto Sánchez",
    phone: "+52 55 4567 8901",
    email: "roberto.s@email.com",
    status: "Inactive",
    lastVisit: "Aug 20, 2025",
    lastVisitType: "Extraction",
    ltv: 580,
    avatar: "RS",
  },
  {
    id: "5",
    name: "Laura Hernández",
    phone: "+52 55 5678 9012",
    email: "laura.h@email.com",
    status: "Active",
    lastVisit: "Jan 10, 2026",
    lastVisitType: "Whitening",
    ltv: 3200,
    avatar: "LH",
  },
  {
    id: "6",
    name: "Miguel Torres",
    phone: "+52 55 6789 0123",
    email: "miguel.t@email.com",
    status: "Active",
    lastVisit: "Dec 28, 2025",
    lastVisitType: "Crown",
    ltv: 4100,
    avatar: "MT",
  },
  {
    id: "7",
    name: "Patricia López",
    phone: "+52 55 7890 1234",
    email: "patricia.l@email.com",
    status: "No-Show Risk",
    lastVisit: "Oct 15, 2025",
    lastVisitType: "Filling",
    ltv: 720,
    avatar: "PL",
  },
]

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Inactive: "bg-muted text-muted-foreground border-border",
  "No-Show Risk": "bg-destructive/10 text-destructive border-destructive/20",
}

export function PatientsContent() {
  const [selectedPatient, setSelectedPatient] = useState<(typeof patients)[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPatients = patients.filter(
    (patient) => patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || patient.phone.includes(searchQuery),
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">{patients.length} patients in your directory</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="shrink-0 bg-transparent">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px]">Patient</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[180px]">Last Visit</TableHead>
              <TableHead className="w-[120px] text-right">LTV</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow
                key={patient.id}
                className="cursor-pointer transition-colors hover:bg-secondary/50"
                onClick={() => setSelectedPatient(patient)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {patient.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{patient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{patient.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[patient.status]}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-foreground">{patient.lastVisit}</p>
                    <p className="text-xs text-muted-foreground">{patient.lastVisitType}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-sm font-medium text-foreground">${patient.ltv.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Patient
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Appointment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete Patient</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Patient Detail Sheet */}
      <PatientSheet patient={selectedPatient} open={!!selectedPatient} onClose={() => setSelectedPatient(null)} />
    </div>
  )
}
