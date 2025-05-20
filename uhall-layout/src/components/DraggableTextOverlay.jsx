import React, { useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const ItemTypes = {
  TAG: 'tag',
};

const DraggableTag = ({ id, x, y, roomID, moveTag, fillColor = "rgba(255,255,255,0.6)" }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TAG,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    item: () => ({ id, x, y }),
    end: (item, monitor) => {
      console.log(`Drag ended for ${id}`);
    },
  }), [id, x, y]);

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.TAG,
    hover(item, monitor) {
      if (item.id !== id) return;
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;
      const newX = Math.round(item.x + delta.x);
      const newY = Math.round(item.y + delta.y);
      console.log(`Hover moveTag called for ${id} to (${newX}, ${newY})`);
      moveTag(id, newX, newY);
      item.x = newX;
      item.y = newY;
    },
  }), [id, moveTag]);

  return (
    <g
      ref={(node) => drag(drop(node))}
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        outline: isDragging ? '2px solid red' : 'none',
        filter: isDragging ? 'drop-shadow(0 0 5px red)' : 'none',
        transition: 'outline 0.2s ease, filter 0.2s ease',
      }}
    >
      <circle
        cx={x}
        cy={y}
        r={22}
        fill={fillColor}
        stroke="gray"
        strokeWidth="1"
        pointerEvents="visiblePainted"
      />
      <text
        x={x}
        y={y - 8}
        fontSize={10}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ userSelect: 'none', pointerEvents: 'auto' }}
        title={roomID}
      >
        {roomID}
      </text>
    </g>
  );
};

const DraggableTextOverlay = ({ floor }) => {
  const [textData, setTextData] = useState([]);

  useEffect(() => {
    if (floor === '3') {
      const fileName = '/data/new_room_coordinates_UNH3.json';
      fetch(fileName)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to load " + fileName + ": " + res.statusText);
          }
          return res.json();
        })
        .then((data) => {
          const filteredData = data.filter(
            (item) => item.text && item.x !== undefined && item.y !== undefined
          );
          setTextData(filteredData);
        })
        .catch(() => {
          setTextData([]);
        });
    } else {
      const fileName = '/public/merged_room_data.json';
      fetch(fileName)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to load " + fileName + ": " + res.statusText);
          }
          return res.json();
        })
        .then((data) => {
          const floorKey = floor === '4' ? 'UNH-4 11x17.svg' : '';
          const filteredData = (data[floorKey] || []).filter(
            (item) => item.RoomID && item.x !== undefined && item.y !== undefined
          );
          setTextData(filteredData);
        })
        .catch(() => {
          setTextData([]);
        });
    }
  }, [floor]);

  const moveTag = (id, newX, newY) => {
    setTextData((prevData) =>
      prevData.map((item) =>
        (item.text === id || item.RoomID === id)
          ? { ...item, x: newX, y: newY }
          : item
      )
    );
  };

  return (
    <svg style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
      {textData.map((item, index) => {
        const x = item.x || 0;
        const y = item.y || 0;
        const roomID = floor === '3' ? item.text : item.RoomID;
        if (!roomID) return null;
        if (floor === '3' || floor === '4') {
          return (
            <DraggableTag
              key={index}
              id={roomID}
              x={x}
              y={y}
              roomID={roomID}
              moveTag={moveTag}
            />
          );
        }
        return null;
      })}
      {/* Test draggable red tag for debugging */}
      <DraggableTag
        id="test-red-tag"
        x={100}
        y={100}
        roomID="Test Red Tag"
        moveTag={(id, newX, newY) => {
          console.log(`Moved ${id} to (${newX}, ${newY})`);
        }}
      />
    </svg>
  );
};

export default DraggableTextOverlay;
