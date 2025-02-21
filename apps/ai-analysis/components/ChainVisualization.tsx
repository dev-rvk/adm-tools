"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  MarkerType,
  Position,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Check, Copy, Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import ELK from 'elkjs/lib/elk.bundled.js'
import { Handle } from 'reactflow'


interface ChainVisualizationProps {
  chain: string[][]
  onClose: () => void
}

const elk = new ELK()

const truncateName = (name: string) => {
  return name.length > 15 ? `...${name.slice(-15)}` : name;
}

const CustomNode = ({ data }: { data: { label: string, fullName: string } }) => {
  const [showFullName, setShowFullName] = useState(false);
  const displayName = truncateName(data.fullName);

  return (
    <div 
      className="relative z-10 px-6 py-3 bg-blue-100 border-2 border-blue-200 rounded-full min-w-[250px] min-h-[60px] cursor-pointer flex items-center justify-center"
      onClick={() => setShowFullName(!showFullName)}
    >
      <div className="source-handle" style={{ position: 'absolute', right: 0, top: '50%' }}>
        <Handle type="source" position={Position.Right} />
      </div>
      <div className="target-handle" style={{ position: 'absolute', left: 0, top: '50%' }}>
        <Handle type="target" position={Position.Left} />
      </div>
      {showFullName && (
        <button 
          className="absolute top-1 left-1 text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(data.fullName);
          }}
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
      <div className="text-center text-sm">
        {showFullName ? data.fullName : displayName}
      </div>
    </div>
  );
};



const EndNode = ({ data }: { data: { label: string, fullName: string } }) => {
  const [showFullName, setShowFullName] = useState(false);
  const displayName = truncateName(data.fullName);

  return (
    <div 
      className="relative w-[120px] h-[120px] bg-red-500 text-white cursor-pointer flex items-center justify-center"
      onClick={() => setShowFullName(!showFullName)}
    >
      <Handle type="target" position={Position.Left} />
      {showFullName && (
        <button 
          className="absolute top-1 left-1 text-white"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(data.fullName);
          }}
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
      <div 
        className={`text-center px-2 text-sm break-words ${
          showFullName ? "block" : "truncate"
        }`}
      >
        {showFullName ? data.fullName : displayName}
      </div>
    </div>
  );
};



const nodeTypes = {
  custom: CustomNode,
  endNode: EndNode,
}

export default function ChainVisualization({ chain, onClose }: ChainVisualizationProps) {
  const [copied, setCopied] = useState(false)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const flowRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const copyToClipboard = useCallback(() => {
    const chainString = chain.map(path => path.join(' -> ')).join('\n')
    navigator.clipboard.writeText(chainString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [chain])

  const saveAsPng = useCallback(() => {
    if (flowRef.current === null || !reactFlowInstance) {
      return
    }

    // Fit view before saving
    reactFlowInstance.fitView({ padding: 0.2, includeHiddenNodes: false })

    setTimeout(() => {
      toPng(flowRef.current!, { backgroundColor: '#ffffff' })
        .then((dataUrl) => {
          const link = document.createElement('a')
          link.download = 'chain-visualization.png'
          link.href = dataUrl
          link.click()
        })
        .catch((err) => {
          console.error('Error saving the image:', err)
        })
    }, 100) // Small delay to ensure the fit view has been applied
  }, [reactFlowInstance])

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    const endNode = chain[0][chain[0].length - 1]
    
    const endNodeId = 'end-node'
    nodes.push({
      id: endNodeId,
      type: 'endNode',
      data: { label: truncateName(endNode), fullName: endNode },
      position: { x: 0, y: 0 }, // Initial position, will be updated by ELK
    })

    chain.forEach((path, pathIndex) => {
      for (let i = 0; i < path.length - 1; i++) {
        const func = path[i]
        const nodeId = `${func}-${pathIndex}-${i}`
        
        nodes.push({
          id: nodeId,
          type: 'custom',
          data: { label: truncateName(func), fullName: func },
          position: { x: 0, y: 0 }, // Initial position, will be updated by ELK
        })

        const nextNodeId = i === path.length - 2 ? endNodeId : `${path[i + 1]}-${pathIndex}-${i + 1}`
        edges.push({
          id: `${nodeId}-${nextNodeId}`,
          source: nodeId,
          target: nextNodeId,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#000000',
          },
          style: { 
            stroke: '#000000', 
            strokeWidth: 2,
          },
          sourceHandle: 'right',
          targetHandle: 'left'
        })        
      }
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [chain])

  useEffect(() => {
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '100', // Increased spacing between nodes
        'elk.layered.spacing.baseValue': '100', // Base spacing for layers
        'elk.spacing.componentComponent': '100', // Spacing between components
      },
      children: initialNodes.map((node) => ({
        id: node.id,
        width: 250,
        height: node.type === 'endNode' ? 120 : 60,
      })),
      edges: initialEdges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };
    
  
    elk.layout(elkGraph).then((layoutedGraph) => {
      const layoutedNodes = initialNodes.map((node) => {
        const layoutNode = layoutedGraph.children?.find((n) => n.id === node.id);
        return {
          ...node,
          position: { x: layoutNode?.x || 0, y: layoutNode?.y || 0 },
        };
      });
  
      setNodes(layoutedNodes);
      setEdges(
        initialEdges.map((edge) => ({
          ...edge,
          source: edge.source,
          target: edge.target,
          style: { stroke: 'black', strokeWidth: 2 },
        }))
      );
    });
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chain Visualization</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[70vh] bg-white" ref={flowRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.2,
              minZoom: 0.1,
              maxZoom: 1.5,
            }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: 'black', // Ensure visibility
                strokeWidth: 2,
              },
            }}
            minZoom={0.1}
            maxZoom={1.5}
            onInit={setReactFlowInstance}
          >
            <Background color="#f0f0f0" />
            <Controls />
          </ReactFlow>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Chain'}
          </Button>
          <Button
            variant="outline"
            onClick={saveAsPng}
          >
            <Download className="mr-2 h-4 w-4" />
            Save as PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

