import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ProgressBar, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Layout } from '../../components/Layout';
import { api, handleApiError } from '../../lib/api';

const HighLevelAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: questions, isLoading } = useQuery(['high-level-questions'], async () => {
    const response = await api.get('/assessments/high-level/questions');
    return response.data.data;
  });

  const { data: responses } = useQuery(['high-level-responses', id], async () => {
    const response = await api.get(`/assessments/${id}/high-level`);
    return response.data.data || {};
  });

  const updateMutation = useMutation(
    async (data: any) => await api.put(`/assessments/${id}/high-level`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['high-level-responses', id]);
      },
      onError: (err) => setError(handleApiError(err))
    }
  );

  const calculateMutation = useMutation(
    async () => await api.post(`/assessments/${id}/high-level/calculate`),
    {
      onSuccess: (response) => {
        const score = response.data.data.overallScore.toFixed(1);
        alert(`Score calculated: ${score}%`);
        navigate(`/assessments/${id}`);
      }
    }
  );

  const handleResponseChange = (questionId: string, value: boolean | null) => {
    const newResponses = { ...responses, [questionId]: value };
    updateMutation.mutate({ responses: newResponses });
  };

  const groupedQuestions = questions?.reduce((acc: any, q: any) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {}) || {};

  const totalQuestions = questions?.length || 0;
  const answeredQuestions = Object.values(responses || {}).filter(v => v !== null).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  if (isLoading) {
    return (
      <Layout>
        <Container className="text-center py-5">
          <div className="spinner-border text-primary" />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Row className="mb-4">
          <Col>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/assessments/${id}`)}>
              ← Back
            </Button>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <h1>High-Level Assessment</h1>
            <p className="text-muted">Answer these questions to get a DR readiness score</p>
            <ProgressBar now={progress} label={`${answeredQuestions}/${totalQuestions} answered`} className="mb-2" />
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {Object.entries(groupedQuestions).map(([category, categoryQuestions]: [string, any]) => (
          <Card key={category} className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">{category}</h5>
            </Card.Header>
            <Card.Body>
              {categoryQuestions.map((question: any) => (
                <div key={question.id} className="mb-4 pb-3 border-bottom">
                  <h6>{question.text}</h6>
                  {question.helpText && <p className="text-muted small">{question.helpText}</p>}
                  <div className="btn-group" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name={`q-${question.id}`}
                      id={`${question.id}-yes`}
                      checked={responses?.[question.id] === true}
                      onChange={() => handleResponseChange(question.id, true)}
                    />
                    <label className="btn btn-outline-success" htmlFor={`${question.id}-yes`}>Yes</label>

                    <input
                      type="radio"
                      className="btn-check"
                      name={`q-${question.id}`}
                      id={`${question.id}-no`}
                      checked={responses?.[question.id] === false}
                      onChange={() => handleResponseChange(question.id, false)}
                    />
                    <label className="btn btn-outline-danger" htmlFor={`${question.id}-no`}>No</label>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        ))}

        <div className="text-center mb-5">
          <Button
            variant="primary"
            size="lg"
            onClick={() => calculateMutation.mutate()}
            disabled={answeredQuestions === 0 || calculateMutation.isLoading}
          >
            {calculateMutation.isLoading ? 'Calculating...' : 'Calculate Score'}
          </Button>
        </div>
      </Container>
    </Layout>
  );
};

export default HighLevelAssessmentPage;
