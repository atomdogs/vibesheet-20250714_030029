import React, { useState, useMemo, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import dayjs from 'dayjs'

const DragAndDropPostScheduler: React.FC<DragAndDropPostSchedulerProps> = ({
  drafts: initialDrafts,
  scheduled: initialScheduled,
  onSchedule,
  onReschedule,
  onUnSchedule,
}) => {
  const [drafts, setDrafts] = useState<Post[]>(initialDrafts)
  const [scheduled, setScheduled] = useState<ScheduledPost[]>(initialScheduled)

  const weekStart = dayjs().startOf('week').add(1, 'day')
  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day')),
    [weekStart]
  )
  const hours = useMemo(() => Array.from({ length: 11 }).map((_, i) => i + 8), [])

  const scheduledMap = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {}
    scheduled.forEach((post) => {
      const key = `${post.date}-${post.hour}`
      if (!map[key]) map[key] = []
      map[key].push(post)
    })
    return map
  }, [scheduled])

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return

      const srcId = source.droppableId
      const destId = destination.droppableId

      if (srcId === destId) return

      // From drafts to calendar slot
      if (srcId === 'drafts' && destId.startsWith('slot-')) {
        const [, date, hourStr] = destId.split('-')
        const hour = parseInt(hourStr, 10)
        const post = drafts.find((p) => p.id === draggableId)
        if (!post) return
        await onSchedule(post, date, hour)
        setDrafts((d) => d.filter((p) => p.id !== post.id))
        setScheduled((s) => [...s, { ...post, date, hour }])
        return
      }

      // From calendar slot to drafts
      if (srcId.startsWith('slot-') && destId === 'drafts') {
        const post = scheduled.find((p) => p.id === draggableId)
        if (!post) return
        await onUnSchedule(post)
        setScheduled((s) => s.filter((p) => p.id !== post.id))
        setDrafts((d) => [...d, { id: post.id, title: post.title, content: post.content }])
        return
      }

      // From one slot to another
      if (srcId.startsWith('slot-') && destId.startsWith('slot-')) {
        const [, , oldHourStr] = srcId.split('-')
        const [, newDate, newHourStr] = destId.split('-')
        const newHour = parseInt(newHourStr, 10)
        const post = scheduled.find((p) => p.id === draggableId)
        if (!post) return
        await onReschedule(post, newDate, newHour)
        setScheduled((s) =>
          s.map((p) =>
            p.id === post.id
              ? { ...p, date: newDate, hour: newHour }
              : p
          )
        )
        return
      }
    },
    [drafts, scheduled, onSchedule, onUnSchedule, onReschedule]
  )

  return (
    <div className="flex h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-1/4 p-4 border-r overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Draft Posts</h2>
          <Droppable droppableId="drafts">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {drafts.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id} index={index}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className={`p-3 bg-white rounded shadow ${
                          snapshot.isDragging ? 'opacity-80' : 'opacity-100'
                        }`}
                      >
                        <h3 className="font-medium">{post.title}</h3>
                        <p className="text-sm text-gray-600 truncate">{post.content}</p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        <div className="w-3/4 p-4 overflow-auto">
          <div className="grid grid-cols-8">
            <div className="border p-2 bg-gray-50"></div>
            {weekDays.map((day) => (
              <div
                key={day.format('YYYY-MM-DD')}
                className="border p-2 text-center font-medium bg-gray-50"
              >
                {day.format('ddd MM/DD')}
              </div>
            ))}
          </div>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8">
              <div className="border p-2 text-right text-sm bg-gray-50">{`${hour}:00`}</div>
              {weekDays.map((day) => {
                const dateStr = day.format('YYYY-MM-DD')
                const slotId = `slot-${dateStr}-${hour}`
                const items = scheduledMap[`${dateStr}-${hour}`] || []
                return (
                  <Droppable key={slotId} droppableId={slotId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`border min-h-20 p-1 ${
                          snapshot.isDraggingOver ? 'bg-blue-100' : ''
                        }`}
                      >
                        {items.map((post, idx) => (
                          <Draggable key={post.id} draggableId={post.id} index={idx}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`p-2 bg-white rounded shadow mb-1 ${
                                  snap.isDragging ? 'opacity-80' : 'opacity-100'
                                }`}
                              >
                                <h4 className="text-sm font-medium">{post.title}</h4>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default DragAndDropPostScheduler