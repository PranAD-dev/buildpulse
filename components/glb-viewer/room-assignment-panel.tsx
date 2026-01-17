'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Home } from 'lucide-react'
import type { Assignment } from '@/lib/assignment-store'

export interface Room {
  id: string
  name: string
}

interface RoomAssignmentPanelProps {
  rooms: Room[]
  currentSelection: {
    type: 'mesh' | 'material' | null
    meshUuid?: string
    materialName?: string
    assignment?: Assignment
  } | null
  assignments: Assignment[]
  onAssign: (roomId: string) => void
  onUnassign: () => void
  onAddRoom: (name: string) => void
  onRemoveRoom: (roomId: string) => void
  onRoomClick: (roomId: string) => void
}

export function RoomAssignmentPanel({
  rooms,
  currentSelection,
  assignments,
  onAssign,
  onUnassign,
  onAddRoom,
  onRemoveRoom,
  onRoomClick,
}: RoomAssignmentPanelProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [newRoomName, setNewRoomName] = useState('')
  const [isAddingRoom, setIsAddingRoom] = useState(false)

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      onAddRoom(newRoomName.trim())
      setNewRoomName('')
      setIsAddingRoom(false)
    }
  }

  const getRoomAssignmentCount = (roomId: string): number => {
    return assignments.filter((a) => a.roomId === roomId).length
  }

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Room Assignment</h2>
        <p className="text-xs text-muted-foreground mt-1">Select and assign model parts to rooms</p>
      </div>

      {/* Current Selection */}
      <div className="p-4 border-b border-border">
        <Label className="text-sm font-medium text-foreground mb-2 block">Current Selection</Label>
        {currentSelection ? (
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {currentSelection.type === 'mesh' ? 'Mesh' : 'Material'}
                </Badge>
                {currentSelection.assignment && (
                  <Badge className="text-xs bg-accent text-accent-foreground">
                    {rooms.find((r) => r.id === currentSelection.assignment?.roomId)?.name || 'Unknown'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {currentSelection.type === 'mesh'
                  ? `Mesh: ${currentSelection.meshUuid?.substring(0, 8)}...`
                  : `Material: ${currentSelection.materialName || 'Unnamed'}`}
              </p>
            </div>

            <div className="space-y-2">
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  onClick={() => onAssign(selectedRoomId)}
                  disabled={!selectedRoomId}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="sm"
                >
                  Assign
                </Button>
                <Button
                  onClick={onUnassign}
                  disabled={!currentSelection.assignment}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Unassign
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Click on the model to select</p>
          </div>
        )}
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium text-foreground">Rooms</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingRoom(true)}
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {/* Add New Room */}
        {isAddingRoom && (
          <Card className="mb-3 border-accent/50">
            <CardContent className="pt-3 pb-3 space-y-2">
              <Input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddRoom()
                  if (e.key === 'Escape') {
                    setIsAddingRoom(false)
                    setNewRoomName('')
                  }
                }}
                autoFocus
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddRoom} size="sm" className="flex-1 h-7 bg-accent hover:bg-accent/90">
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingRoom(false)
                    setNewRoomName('')
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rooms */}
        <div className="space-y-2">
          {rooms.map((room) => {
            const count = getRoomAssignmentCount(room.id)
            return (
              <div
                key={room.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => onRoomClick(room.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Home className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} assignment{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveRoom(room.id)
                  }}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>

        {rooms.length === 0 && !isAddingRoom && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No rooms yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add" to create a room</p>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Total: {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
