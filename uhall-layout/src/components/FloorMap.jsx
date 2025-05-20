// Imports and constants
import React, { useState, useEffect } from 'react';
import * as ReactSVGPanZoom from 'react-svg-pan-zoom';
import Papa from 'papaparse';
import DraggableOffice from './DraggableOffice';
import DraggableTextOverlay from './DraggableTextOverlay';

import { useDrag, useDrop } from 'react-dnd';

const ItemTypes = {
  OFFICE: 'office',
  TEXT: 'text',
};

const DraggableOfficeDnd = ({ room, style }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.OFFICE,
    item: { roomId: room.RoomID },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  if (!room || !room.RoomID) {
    return null; // Do not render if no valid room data
  }

  return (
    <div
      ref={drag}
      style={{
        position: 'absolute',
        top: style.top || 0,
        left: style.left || 0,
        backgroundColor: isDragging ? 'rgba(0, 123, 255, 0.9)' : 'rgba(0, 123, 255, 0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'background-color 0.3s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        minWidth: '180px',
        maxWidth: '220px',
        fontSize: '14px',
        lineHeight: '1.3',
        ...style,
      }}
      title={`${room.RoomName} (${room.RoomID})`}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{room.RoomName || 'Unknown Room'}</div>
      <div>{room.OrgTypeName || 'No Department'}</div>
      <div>Area: {room.RoomArea || 'N/A'} sq ft</div>
    </div>
  );
};

const FloorMap = () => {
  const [floor, setFloor] = useState('3');
  const [value, setValue] = useState({
    version: 1,
    mode: 'none',
    focus: false,
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
  });
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [roomMapping, setRoomMapping] = useState([]);
  const [officeData, setOfficeData] = useState([]);
  const [textData, setTextData] = useState([]);
  const [roomMappingError, setRoomMappingError] = useState(null);
  const [csvError, setCsvError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem('assignments');
    return saved ? JSON.parse(saved) : {};
  });
  const [dragOverRoom, setDragOverRoom] = useState(null);
  const [filterDept, setFilterDept] = useState('All');
  const [filterUsage, setFilterUsage] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [usageTypes, setUsageTypes] = useState([]);
  const [changeLog, setChangeLog] = useState(() => {
    const saved = localStorage.getItem('changeLog');
    return saved ? JSON.parse(saved) : [];
  });
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Use the same source for third floor as fourth floor
    const mappingFile = '/room-mapping-4.json';
    setLoading(true);
    fetch(mappingFile)
      .then((res) => {
        if (!res.ok) {
          const errorMsg = `Failed to load room mapping: ${res.statusText}`;
          setRoomMappingError(errorMsg);
          setLoading(false);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setRoomMapping(data);
        setRoomMappingError(null);
        setLoading(false);
      })
      .catch((error) => {
        setRoomMappingError(error.message);
        setLoading(false);
      });
  }, [floor]);

  useEffect(() => {
    // Use the same CSV source for third floor as fourth floor
    const csvFile = '/Copy of UNH QUERY 8-15-24 (No Names).csv';
    fetch(csvFile)
      .then((response) => {
        if (!response.ok) {
          setCsvError(`Failed to load CSV: ${response.statusText}`);
          setLoading(false);
          return '';
        }
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setRoomMappingError(null);
            setOfficeData(results.data);
            setCsvError(null);
            const depts = Array.from(new Set(results.data.map(r => r.OrgTypeName).filter(Boolean)));
            const usages = Array.from(new Set(results.data.map(r => r.ChargeBackAssignment).filter(Boolean)));
            setDepartments(depts);
            setUsageTypes(usages);
            setLoading(false);
          },
          error: (error) => {
            setCsvError(error.message);
            setLoading(false);
          },
        });
      })
      .catch((error) => {
        setCsvError(error.message);
        setLoading(false);
      });
  }, [floor]);

  useEffect(() => {
    // Load merged_room_data.json and set textData for current floor
    fetch('/public/merged_room_data.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load merged_room_data.json: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Use the same source for third floor as fourth floor
        const floorKey = 'UNH-4 11x17.svg';
        setTextData(data[floorKey] || []);
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(error.message);
      });
  }, [floor]);

  useEffect(() => {
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('changeLog', JSON.stringify(changeLog));
  }, [changeLog]);

  const handleDrop = (e, targetRoom) => {
    e.preventDefault();
    setDragOverRoom(null);
    const draggedRoomId = e.dataTransfer.getData('roomId');
    const draggedFloor = e.dataTransfer.getData('floor');
    if (draggedRoomId && draggedRoomId !== targetRoom.RoomID) {
      setAssignments((prev) => {
        const newAssignments = { ...prev };
        // Swap assignments between draggedRoomId and targetRoom.RoomID
        const targetAssignment = newAssignments[targetRoom.RoomID];
        newAssignments[targetRoom.RoomID] = draggedRoomId;
        if (targetAssignment) {
          newAssignments[draggedRoomId] = targetAssignment;
        } else {
          delete newAssignments[draggedRoomId];
        }
        return newAssignments;
      });
      setChangeLog((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          from: `${draggedFloor} - ${draggedRoomId}`,
          to: `${floor} - ${targetRoom.RoomID}`,
        },
      ]);
    }
  };

  const handleDragOver = (e, room) => {
    e.preventDefault();
    setDragOverRoom(room.RoomID);
  };

  const handleDragLeave = () => {
    setDragOverRoom(null);
  };

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.OFFICE,
    drop: (item, monitor) => {
      // Implement drop logic if needed
    },
  }));

  const Viewer = ReactSVGPanZoom.ReactSVGPanZoom;

  return (
    <div style={{ width: '100%', height: '95vh', position: 'relative' }} ref={drop}>
      <div style={{ marginBottom: '10px', position: 'relative', zIndex: 10 }}>
        <button onClick={() => setFloor('3')} disabled={floor === '3'}>
          3rd Floor
        </button>
        <button onClick={() => setFloor('4')} disabled={floor === '4'} style={{ marginLeft: '10px' }}>
          4th Floor
        </button>
      </div>
      {loading && <div>Loading map data...</div>}
      {roomMappingError && <div style={{ color: 'red' }}>Error loading map: {roomMappingError}</div>}
      {csvError && <div style={{ color: 'red' }}>Error loading CSV: {csvError}</div>}
      {errorMessage && <div style={{ color: 'red' }}>Error: {errorMessage}</div>}
      {/*
        Increase SVG size for better legibility
      */}
      <Viewer
        width={2000}
        height={550}
        onChangeValue={setValue}
        value={value}
        tool="auto"
        detectAutoPan={false}
        toolbarProps={{ toolbarPosition: "none" }}
        onChangeTool={(tool) => setValue((v) => ({ ...v, tool }))}
        background="white"
        onMouseDown={(e) => {
          // Prevent pan/zoom when dragging a tag or its children
          let el = e.target;
          while (el && el !== e.currentTarget) {
            if (el.getAttribute && el.getAttribute('draggable') === 'true') {
              e.stopPropagation();
              break;
            }
            el = el.parentNode;
          }
        }}
        onTouchStart={(e) => {
          let el = e.target;
          while (el && el !== e.currentTarget) {
            if (el.getAttribute && el.getAttribute('draggable') === 'true') {
              e.stopPropagation();
              break;
            }
            el = el.parentNode;
          }
        }}
      >
        {floor === '3' ? (
          <svg width={2000} height={550} viewBox="0 0 1423.04 390.88" style={{ userSelect: 'none' }}>
            <image href="/UNH-3 11x17.svg" x="0" y="0" width={1423.04} height={390.88} />
            <DraggableTextOverlay floor="3" />
          </svg>
        ) : (
          <svg width={2000} height={550} viewBox="0 0 1423.04 390.88" style={{ userSelect: 'none' }}>
            <image href="/UNH-4 11x17.svg" x="0" y="0" width={1423.04} height={390.88} />
            <DraggableTextOverlay floor="4" />
          </svg>
        )}
      </Viewer>
      {/* Overlays for a single test room */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, pointerEvents: 'auto' }}>
        {roomMapping
          .filter(room => room.RoomID === '3525')
          .map((room) => {
            const top = room.metadata?.y || 100;
            const left = room.metadata?.x || 100;
            const isDragOver = dragOverRoom === room.RoomID;
            // Find matching office data for this room
            const officeInfo = officeData.find(office => office.RoomID === room.RoomID) || {};
            console.log(`Rendering overlay for room ${room.RoomID} with office info:`, officeInfo);
            return (
              <div
                key={room.RoomID}
                onDrop={(e) => handleDrop(e, room)}
                onDragOver={(e) => handleDragOver(e, room)}
                onDragLeave={handleDragLeave}
                onDragStart={() => console.log(`Drag started for room ${room.RoomID}`)} // Added drag start log
                onDragEnd={() => console.log(`Drag ended for room ${room.RoomID}`)} // Added drag end log
                style={{
                  position: 'absolute',
                  top,
                  left,
                  border: isDragOver ? '2px solid #007bff' : 'none',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 123, 255, 0.5)', // Added background for visibility
                  padding: '4px', // Added padding for better appearance
                  color: 'white', // Text color for readability
                  maxWidth: '220px',
                  cursor: 'grab',
                }}
              >
                <DraggableOfficeDnd
                  room={{
                    ...room.metadata,
                    OrgTypeName: officeInfo.OrgTypeName,
                    RoomArea: officeInfo.RoomArea,
                  }}
                  style={{ cursor: 'grab' }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default FloorMap;
