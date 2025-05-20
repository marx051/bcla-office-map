import React from 'react';
import FloorMap from './components/FloorMap';
import ErrorBoundary from './components/ErrorBoundary';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        <div className="App" style={{ padding: '20px' }}>
          <h1>University Hall Interactive Map</h1>
          <FloorMap />
        </div>
      </DndProvider>
    </ErrorBoundary>
  );
}

export default App;
