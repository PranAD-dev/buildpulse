'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Trash2,
  Home,
  Camera,
  ChevronRight,
  Sparkles,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { Room, RoomSuggestion } from '@/lib/room-store'
import { DEFAULT_COMPONENT_TYPES } from '@/lib/room-store'
import { ROOM_COLORS } from '@/lib/highlight-manager'

interface SelectionInfo {
  type: 'mesh' | 'material' | null
  meshUuid?: string
  materialName?: string
  isHorizontal?: boolean
  surfaceArea?: number
}

interface RoomPanelProps {
  rooms: Room[]
  currentSelection: SelectionInfo | null
  suggestion: RoomSuggestion | null
  selectedRoomId: string | null
  onCreateRoom: (name: string) => void
  onDeleteRoom: (roomId: string) => void
  onRoomClick: (roomId: string) => void
  onAssignSelection: (roomId: string) => void
  onUnassignSelection: () => void
  onUpdateProgress: (roomId: string, progress: number) => void
  onUploadPhoto: (roomId: string, file: File) => void
  onRemovePhoto: (roomId: string, photoId: string) => void
  onAnalyzeRoom: (roomId: string) => void
  isSelectionAssigned: boolean
  assignedRoomName?: string
  isAnalyzing?: boolean
}

export function RoomPanel({
  rooms,
  currentSelection,
  suggestion,
  selectedRoomId,
  onCreateRoom,
  onDeleteRoom,
  onRoomClick,
  onAssignSelection,
  onUnassignSelection,
  onUpdateProgress,
  onUploadPhoto,
  onRemovePhoto,
  onAnalyzeRoom,
  isSelectionAssigned,
  assignedRoomName,
  isAnalyzing = false,
}: RoomPanelProps) {
  const [newRoomName, setNewRoomName] = useState('')
  const [isAddingRoom, setIsAddingRoom] = useState(false)
  const [customRoomName, setCustomRoomName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [activeTab, setActiveTab] = useState('assign')

  const handleCreateRoom = (name: string) => {
    if (name.trim()) {
      onCreateRoom(name.trim())
      setNewRoomName('')
      setCustomRoomName('')
      setIsAddingRoom(false)
      setShowCustomInput(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, roomId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      onUploadPhoto(roomId, file)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="w-3 h-3" />
      case 'medium':
        return <AlertCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  const getRoomColor = (roomId: string): string => {
    const normalizedId = roomId.toLowerCase().replace(/[_\s]/g, '-')
    for (const key of Object.keys(ROOM_COLORS)) {
      if (normalizedId.includes(key)) {
        return `#${ROOM_COLORS[key].toString(16).padStart(6, '0')}`
      }
    }
    return `#${ROOM_COLORS['default'].toString(16).padStart(6, '0')}`
  }

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-border bg-primary/5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Home className="w-5 h-5 text-accent" />
          Component Progress Demo
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Click on surfaces to assign building components
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 max-w-[calc(100%-2rem)] flex-shrink-0">
          <TabsTrigger value="assign">Assign</TabsTrigger>
          <TabsTrigger value="rooms">
            Zones ({rooms.length})
          </TabsTrigger>
        </TabsList>

        {/* Assignment Tab */}
        <TabsContent value="assign" className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Current Selection */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Current Selection
            </Label>
            {currentSelection ? (
              <Card className="border-accent/50">
                <CardContent className="pt-4 space-y-3">
                  {/* Selection Type Badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {currentSelection.type === 'mesh' ? 'Mesh' : 'Material'}
                    </Badge>
                    {isSelectionAssigned && (
                      <Badge className="text-xs bg-green-500/20 text-green-500 border-green-500/30">
                        Assigned to: {assignedRoomName}
                      </Badge>
                    )}
                  </div>

                  {/* Selection Details */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Type:</span>
                      {currentSelection.isHorizontal ? 'Floor/Ceiling' : 'Wall/Object'}
                    </p>
                    {currentSelection.surfaceArea && (
                      <p className="flex items-center gap-1">
                        <span className="font-medium">Size:</span>
                        {currentSelection.surfaceArea > 50
                          ? 'Large'
                          : currentSelection.surfaceArea > 20
                          ? 'Medium'
                          : 'Small'}
                      </p>
                    )}
                  </div>

                  {/* AI Suggestion */}
                  {suggestion && !isSelectionAssigned && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className={`w-4 h-4 text-primary ${suggestion.isLoading ? 'animate-pulse' : ''}`} />
                        <span className="text-sm font-medium text-foreground">
                          AI Suggestion
                        </span>
                        {!suggestion.isLoading && (
                          <span
                            className={`flex items-center gap-1 text-xs ${getConfidenceColor(
                              suggestion.confidence
                            )}`}
                          >
                            {getConfidenceIcon(suggestion.confidence)}
                            {suggestion.confidence}
                          </span>
                        )}
                      </div>

                      {suggestion.isLoading ? (
                        <div className="space-y-2">
                          <div className="h-5 bg-muted/50 rounded animate-pulse" />
                          <div className="h-4 bg-muted/30 rounded w-3/4 animate-pulse" />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground font-semibold">
                            {suggestion.suggestedName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 w-full bg-primary hover:bg-primary/90"
                            onClick={() => handleCreateRoom(suggestion.suggestedName)}
                          >
                            Accept Suggestion
                          </Button>

                          {/* Alternative suggestions */}
                          {suggestion.alternativeNames && suggestion.alternativeNames.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-primary/10">
                              <p className="text-xs text-muted-foreground mb-2">Or try:</p>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.alternativeNames.map((name) => (
                                  <Button
                                    key={name}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => handleCreateRoom(name)}
                                  >
                                    {name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Room Selection */}
                  {!isSelectionAssigned && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Or choose a component:
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            setShowCustomInput(true)
                          } else {
                            handleCreateRoom(value)
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select component type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_COMPONENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">+ Custom name...</SelectItem>
                        </SelectContent>
                      </Select>

                      {showCustomInput && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter component name"
                            value={customRoomName}
                            onChange={(e) => setCustomRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateRoom(customRoomName)
                              if (e.key === 'Escape') setShowCustomInput(false)
                            }}
                            autoFocus
                            className="h-9"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateRoom(customRoomName)}
                            className="h-9"
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      {/* Existing zones to assign to */}
                      {rooms.length > 0 && (
                        <div className="pt-2 border-t border-border mt-2">
                          <Label className="text-xs text-muted-foreground mb-2 block">
                            Assign to existing zone:
                          </Label>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {rooms.map((room) => (
                              <Button
                                key={room.id}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start h-8 text-xs"
                                onClick={() => onAssignSelection(room.id)}
                              >
                                <div
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: getRoomColor(room.id) }}
                                />
                                {room.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unassign Button */}
                  {isSelectionAssigned && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={onUnassignSelection}
                    >
                      Remove Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="p-6 bg-muted/30 rounded-lg text-center border-2 border-dashed border-muted-foreground/20">
                <Eye className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click on the 3D model to select a surface
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Use Mesh or Material mode for different selection types
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Add Zone Button */}
          {!isAddingRoom && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsAddingRoom(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Zone
            </Button>
          )}

          {/* Add Zone Form */}
          {isAddingRoom && (
            <Card className="border-accent/50">
              <CardContent className="pt-4 space-y-2">
                <Input
                  placeholder="Zone/Component name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateRoom(newRoomName)
                    if (e.key === 'Escape') setIsAddingRoom(false)
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCreateRoom(newRoomName)}
                    size="sm"
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => setIsAddingRoom(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rooms List */}
          <div className="space-y-3">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className={`transition-all cursor-pointer hover:border-accent/50 ${
                  selectedRoomId === room.id ? 'border-accent ring-1 ring-accent/30' : ''
                }`}
                onClick={() => onRoomClick(room.id)}
              >
                <CardContent className="pt-4">
                  {/* Room Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getRoomColor(room.id) }}
                      />
                      <span className="font-medium text-foreground">{room.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRoomClick(room.id)
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteRoom(room.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{room.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${room.progress}%`,
                          backgroundColor: getRoomColor(room.id),
                        }}
                      />
                    </div>
                    {/* Progress Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={room.progress}
                      onChange={(e) => {
                        e.stopPropagation()
                        onUpdateProgress(room.id, parseInt(e.target.value))
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-1 appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-accent
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3
                        [&::-moz-range-thumb]:h-3
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-accent
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{room.assignments.length} surfaces</span>
                    <span>{room.photos.length} photos</span>
                  </div>

                  {/* Photos */}
                  {room.photos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {room.photos.slice(0, 4).map((photo) => (
                        <div key={photo.id} className="relative flex-shrink-0">
                          <img
                            src={photo.url}
                            alt="Progress"
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <button
                            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemovePhoto(room.id, photo.id)
                            }}
                          >
                            <X className="w-2 h-2 text-white" />
                          </button>
                        </div>
                      ))}
                      {room.photos.length > 4 && (
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          +{room.photos.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Photo Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 gap-2"
                    disabled={isAnalyzing}
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.getElementById(
                        `photo-upload-${room.id}`
                      ) as HTMLInputElement
                      input?.click()
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    Upload Progress Photo
                  </Button>
                  <input
                    id={`photo-upload-${room.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, room.id)}
                  />

                  {/* Analyze Button - only show if there are photos */}
                  {room.photos.length > 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full mt-2 gap-2"
                      disabled={isAnalyzing}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAnalyzeRoom(room.id)
                      }}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyze Progress
                        </>
                      )}
                    </Button>
                  )}

                  {/* AI Analysis Results */}
                  {room.lastAnalysis && (
                    <div className="mt-3 space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          AI Analysis
                        </span>
                        <Badge variant="outline" className={`text-xs ${getConfidenceColor(room.lastAnalysis.confidence)}`}>
                          {room.lastAnalysis.confidence} confidence
                        </Badge>
                      </div>

                      {/* Completed Items */}
                      {room.lastAnalysis.visible_completed.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
                            {room.lastAnalysis.visible_completed.map((item, i) => (
                              <li key={i} className="list-disc">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Items */}
                      {room.lastAnalysis.still_missing.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Still Missing
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
                            {room.lastAnalysis.still_missing.map((item, i) => (
                              <li key={i} className="list-disc">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes */}
                      {room.lastAnalysis.notes && (
                        <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                          {room.lastAnalysis.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mark Complete Button - only show if progress is >= 90% and < 100% */}
                  {room.progress >= 90 && room.progress < 100 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 gap-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateProgress(room.id, 100)
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Complete (Final Inspection)
                    </Button>
                  )}

                  {/* Show completed badge if 100% */}
                  {room.progress === 100 && (
                    <div className="mt-2 flex items-center justify-center gap-2 py-2 px-3 bg-green-50 rounded-md border border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Inspection Complete</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {rooms.length === 0 && !isAddingRoom && (
            <div className="text-center py-12">
              <Home className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No zones yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Click on the model and accept the AI suggestion, or add zones manually
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Stats */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{rooms.length} zones</span>
          <span>
            {rooms.reduce((acc, r) => acc + r.assignments.length, 0)} total assignments
          </span>
        </div>
      </div>
    </div>
  )
}
