"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Plus, MoreHorizontal, Phone, Mail, Calendar, Eye, Edit, MessageSquareText } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQuery } from "convex/react"
const api = require("@/convex/_generated/api").api;
import { format } from "date-fns"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PatientSheet } from "./patient-sheet"
import { AddPatientDialog } from "./add-patient-dialog"

export function PatientsContent() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<any>(null)
  const [patientToEdit, setPatientToEdit] = useState<any>(null)

  const patients = useQuery(api.patients.list)
  const createPatient = useMutation(api.patients.create)
  const updatePatient = useMutation(api.patients.update)
  const deletePatient = useMutation(api.patients.remove)
  const startChat = useMutation(api.chat.upsertConversation)

  const router = useRouter()

  const handleSavePatient = async (data: any) => {
    try {
      if (patientToEdit) {
        await updatePatient({
          id: patientToEdit._id,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          dni: data.dni,
          email: data.email || undefined,
          lastAppointmentDate: data.lastAppointmentDate ? data.lastAppointmentDate.getTime() : undefined,
          nextAppointmentDate: data.nextAppointmentDate ? data.nextAppointmentDate.getTime() : undefined,
        })
        toast.success("Patient Updated", {
          description: `${data.fullName}'s information has been updated.`,
        })
      } else {
        await createPatient({
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          dni: data.dni,
          email: data.email || undefined,
          lastAppointmentDate: data.lastAppointmentDate ? data.lastAppointmentDate.getTime() : undefined,
          nextAppointmentDate: data.nextAppointmentDate ? data.nextAppointmentDate.getTime() : undefined,
        })
        toast.success("Patient Added", {
          description: `${data.fullName} has been added to your directory.`,
        })
      }
      setIsAddPatientOpen(false)
      setPatientToEdit(null)
    } catch (error) {
      toast.error(patientToEdit ? "Error Updating Patient" : "Error Adding Patient", {
        description: "There was a problem saving the patient. Please try again.",
      })
      console.error(error)
    }
  }

  const handleDeletePatient = async () => {
    if (!patientToDelete) return

    try {
      await deletePatient({ id: patientToDelete._id })
      toast.success("Patient Deleted", {
        description: `${patientToDelete.fullName} has been removed from your directory.`,
      })
      setPatientToDelete(null)
    } catch (error) {
      toast.error("Error Deleting Patient", {
        description: "There was a problem deleting the patient. Please try again.",
      })
      console.error(error)
    }
  }

  const handleSendMessage = async (patient: any) => {
    try {
      const chatId = await startChat({
        channel: "whatsapp",
        externalContact: {
          phoneNumber: patient.phoneNumber,
          name: patient.fullName
        }
      })
      router.push(`/chat?id=${chatId}`)
    } catch (error) {
      toast.error("Error opening chat", {
        description: "Could not start conversation with this patient.",
      })
      console.error(error)
    }
  }

  const handlePatientClick = (patient: any) => {
    setSelectedPatient(patient)
    setSheetOpen(true)
  }

  const filteredPatients = patients?.filter(
    (patient: any) =>
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phoneNumber.includes(searchQuery)
  ) || []

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">{patients?.length || 0} patients in your directory</p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setPatientToEdit(null)
            setIsAddPatientOpen(true)
          }}
        >
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
              <TableHead className="w-[120px]">DNI</TableHead>
              <TableHead className="w-[150px]">Last Visit</TableHead>
              <TableHead className="w-[150px]">Next Visit</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient: any) => (
                <TableRow
                  key={patient._id}
                  className="cursor-pointer transition-colors hover:bg-secondary/50"
                  onClick={() => handlePatientClick(patient)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {getInitials(patient.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{patient.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{patient.phoneNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">{patient.dni}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">
                        {patient.lastAppointmentDate ? format(new Date(patient.lastAppointmentDate), "MMM d, yyyy") : "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">
                        {patient.nextAppointmentDate ? format(new Date(patient.nextAppointmentDate), "MMM d, yyyy") : "-"}
                      </p>
                    </div>
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePatientClick(patient)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSendMessage(patient)
                          }}
                        >
                          {/* <Mail className="mr-2 h-4 w-4" /> */}
                          <MessageSquareText className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Appointment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setPatientToEdit(patient)
                            setIsAddPatientOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Patient
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPatientToDelete(patient)
                          }}
                        >
                          Delete Patient
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )))}
          </TableBody>
        </Table>
      </div>

      {/* Patient Detail Sheet */}
      <PatientSheet
        patient={selectedPatient}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSendMessage={() => selectedPatient && handleSendMessage(selectedPatient)}
      />

      <AddPatientDialog
        open={isAddPatientOpen}
        onOpenChange={(open) => {
          setIsAddPatientOpen(open)
          if (!open) setPatientToEdit(null)
        }}
        onSubmit={handleSavePatient}
        initialData={patientToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!patientToDelete} onOpenChange={(open: boolean) => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{patientToDelete?.fullName}</strong> from your directory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
