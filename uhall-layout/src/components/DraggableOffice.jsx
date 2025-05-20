import React, { useState } from 'react';

const DraggableOffice = ({ room, style, onDragStart }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        top: style.top || 0,
        left: style.left || 0,
        backgroundColor: isDragging ? 'rgba(0, 123, 255, 0.9)' : 'rgba(0, 123, 255, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'background-color 0.3s ease',
        ...style,
      }}
      title={`${room.RoomName} (${room.RoomID})`}
    >
      {room.RoomName}
    </div>
  );
};

export default DraggableOffice;
