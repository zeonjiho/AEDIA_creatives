import React, { useState } from 'react';
import ConnectionManager from './ConnectionManager';
import ss from './ConnectionLine.module.css';

const Example = () => {
    // 예제 요소 정의
    const [elements, setElements] = useState([
        {
            id: 'element1',
            content: <div style={{ width: 100, height: 100, backgroundColor: '#6495ED', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>요소 1</div>,
            position: { x: 100, y: 100 },
            style: { width: 100, height: 100 }
        },
        {
            id: 'element2',
            content: <div style={{ width: 100, height: 100, backgroundColor: '#FF7F50', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>요소 2</div>,
            position: { x: 300, y: 300 },
            style: { width: 100, height: 100 }
        },
        {
            id: 'element3',
            content: <div style={{ width: 100, height: 100, backgroundColor: '#9370DB', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>요소 3</div>,
            position: { x: 500, y: 150 },
            style: { width: 100, height: 100 }
        }
    ]);

    // 초기 연결 정보
    const [connections, setConnections] = useState([
        {
            id: 'conn1',
            sourceId: 'element1',
            targetId: 'element2',
            sourcePosition: 'bottom',
            targetPosition: 'top',
            type: 'curved'
        }
    ]);

    // 연결 정보 변경 핸들러
    const handleConnectionsChange = (newConnections) => {
        setConnections(newConnections);
    };

    return (
        <div style={{ width: '100%', height: '600px', border: '1px solid #ccc', position: 'relative' }}>
            <h2 style={{ position: 'absolute', top: 10, left: 10, margin: 0, zIndex: 100 }}>연결선 예제</h2>
            <p style={{ position: 'absolute', top: 40, left: 10, margin: 0, zIndex: 100 }}>
                요소의 모서리에 있는 점을 드래그하여 다른 요소에 연결하세요.
            </p>
            <ConnectionManager 
                elements={elements} 
                initialConnections={connections}
                onConnectionsChange={handleConnectionsChange}
            />
        </div>
    );
};

export default Example; 