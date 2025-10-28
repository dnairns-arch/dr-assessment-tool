import React, { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, Modal, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Layout } from '../../components/Layout';
import { api, handleApiError } from '../../lib/api';

const DependencyGraphPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [sourceComponent, setSourceComponent] = useState('');
  const [targetComponent, setTargetComponent] = useState('');
  const [dependencyType, setDependencyType] = useState('SYNC');
  const [error, setError] = useState('');

  // Fetch all components for this assessment
  const { data: components, isLoading } = useQuery(['all-components', id], async () => {
    const response = await api.get(`/assessments/${id}/sites`);
    const sites = response.data.data;

    const allComponents: any[] = [];
    for (const site of sites) {
      for (const system of site.systems || []) {
        for (const component of system.components || []) {
          allComponents.push({
            ...component,
            systemName: system.name,
            siteName: site.name
          });
        }
      }
    }
    return allComponents;
  });

  // Fetch dependencies
  const { data: dependencies } = useQuery(['dependencies', id], async () => {
    const response = await api.get(`/assessments/${id}/dependencies`);
    return response.data.data;
  });

  // Create dependency mutation
  const createDependencyMutation = useMutation(
    async (data: any) => await api.post('/dependencies', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['dependencies', id]);
        setShowModal(false);
        setSourceComponent('');
        setTargetComponent('');
        setError('');
      },
      onError: (err) => setError(handleApiError(err))
    }
  );

  // Delete dependency mutation
  const deleteDependencyMutation = useMutation(
    async (depId: string) => await api.delete(`/dependencies/${depId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['dependencies', id]);
      }
    }
  );

  // Transform data into ReactFlow format
  const nodes: Node[] = (components || []).map((comp: any, index: number) => {
    const row = Math.floor(index / 5);
    const col = index % 5;

    return {
      id: comp.id,
      type: 'default',
      data: {
        label: (
          <div style={{ padding: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{comp.name}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>{comp.componentType.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: '9px', color: '#999' }}>{comp.systemName}</div>
          </div>
        )
      },
      position: { x: col * 250, y: row * 150 },
      style: {
        background: comp.isRedundant ? '#d4edda' : '#fff',
        border: comp.hasHealthCheck ? '2px solid #0066CC' : '1px solid #ddd',
        borderRadius: '8px',
        padding: 0,
        width: 200
      }
    };
  });

  const edges: Edge[] = (dependencies || []).map((dep: any) => ({
    id: dep.id,
    source: dep.sourceId,
    target: dep.targetId,
    label: dep.dependencyType,
    type: dep.dependencyType === 'SYNC' ? 'default' : 'step',
    animated: dep.dependencyType === 'ASYNC',
    style: {
      stroke: dep.isRequired ? '#dc3545' : '#6c757d',
      strokeWidth: dep.isRequired ? 2 : 1
    },
    labelStyle: { fontSize: '10px' },
    labelBgStyle: { fill: '#fff' }
  }));

  const [rfNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(nodes);
  }, [components, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [dependencies, setEdges]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceComponent === targetComponent) {
      setError('A component cannot depend on itself');
      return;
    }

    createDependencyMutation.mutate({
      sourceId: sourceComponent,
      targetId: targetComponent,
      dependencyType,
      isRequired: true
    });
  };

  const handleDeleteDependency = (depId: string) => {
    if (window.confirm('Are you sure you want to delete this dependency?')) {
      deleteDependencyMutation.mutate(depId);
    }
  };

  return (
    <Layout>
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/assessments/${id}/deep-dive`)}>
              ← Back to Infrastructure
            </Button>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1>Dependency Graph</h1>
                <p className="text-muted mb-0">Visualize component dependencies and data flow</p>
              </div>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                + Add Dependency
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Card className="shadow-sm">
              <Card.Body className="py-2">
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <small><strong>Legend:</strong></small>
                  <small>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#d4edda', border: '1px solid #c3e6cb', marginRight: '4px' }}></span>
                    Redundant
                  </small>
                  <small>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #0066CC', marginRight: '4px' }}></span>
                    Has Health Check
                  </small>
                  <small>
                    <span style={{ display: 'inline-block', width: '20px', height: '2px', background: '#dc3545', marginRight: '4px' }}></span>
                    Required Dependency
                  </small>
                  <small>
                    <span style={{ display: 'inline-block', width: '20px', height: '1px', background: '#6c757d', marginRight: '4px' }}></span>
                    Optional Dependency
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={9}>
            <Card className="shadow-sm" style={{ height: '600px' }}>
              <Card.Body className="p-0">
                {isLoading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-primary" />
                  </div>
                ) : components?.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center">
                      <p className="text-muted">No components defined yet.</p>
                      <Button variant="primary" onClick={() => navigate(`/assessments/${id}/deep-dive`)}>
                        Add Components
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ReactFlow
                    nodes={rfNodes}
                    edges={rfEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Background />
                    <Controls />
                    <MiniMap nodeColor={(node) => {
                      const comp = components?.find((c: any) => c.id === node.id);
                      return comp?.isRedundant ? '#28a745' : '#6c757d';
                    }} />
                  </ReactFlow>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="shadow-sm mb-3">
              <Card.Header><h6 className="mb-0">Statistics</h6></Card.Header>
              <Card.Body>
                <div className="mb-2">
                  <small className="text-muted">Total Components</small>
                  <h4>{components?.length || 0}</h4>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Dependencies</small>
                  <h4>{dependencies?.length || 0}</h4>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Redundant</small>
                  <h4>{components?.filter((c: any) => c.isRedundant).length || 0}</h4>
                </div>
                <div>
                  <small className="text-muted">Health Checks</small>
                  <h4>{components?.filter((c: any) => c.hasHealthCheck).length || 0}</h4>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header><h6 className="mb-0">Dependencies</h6></Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {dependencies?.length === 0 ? (
                  <p className="text-muted small mb-0">No dependencies defined</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {dependencies?.map((dep: any) => {
                      const source = components?.find((c: any) => c.id === dep.sourceId);
                      const target = components?.find((c: any) => c.id === dep.targetId);
                      return (
                        <div key={dep.id} className="list-group-item px-0 py-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div style={{ fontSize: '11px' }}>
                              <div><strong>{source?.name}</strong></div>
                              <div className="text-muted">→ {target?.name}</div>
                              <Badge bg="secondary" className="mt-1" style={{ fontSize: '9px' }}>
                                {dep.dependencyType}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                              onClick={() => handleDeleteDependency(dep.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add Dependency Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Dependency</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Source Component (depends on)</Form.Label>
              <Form.Select
                value={sourceComponent}
                onChange={(e) => setSourceComponent(e.target.value)}
                required
              >
                <option value="">Select source component...</option>
                {components?.map((comp: any) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.systemName})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Target Component (is depended upon)</Form.Label>
              <Form.Select
                value={targetComponent}
                onChange={(e) => setTargetComponent(e.target.value)}
                required
              >
                <option value="">Select target component...</option>
                {components?.map((comp: any) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.systemName})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dependency Type</Form.Label>
              <Form.Select
                value={dependencyType}
                onChange={(e) => setDependencyType(e.target.value)}
              >
                <option value="SYNC">Synchronous</option>
                <option value="ASYNC">Asynchronous</option>
                <option value="DATA">Data</option>
                <option value="NETWORK">Network</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Synchronous dependencies are shown as solid lines, asynchronous as animated lines.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createDependencyMutation.isLoading}
            >
              {createDependencyMutation.isLoading ? 'Creating...' : 'Create Dependency'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default DependencyGraphPage;
