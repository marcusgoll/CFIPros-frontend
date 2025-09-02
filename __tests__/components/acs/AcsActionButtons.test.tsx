import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useUser } from '@clerk/nextjs';
import AcsActionButtons from '@/components/acs/AcsActionButtons';
import { useAcsPerformance } from '@/hooks/useAcsPerformance';

// Mock the hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/hooks/useAcsPerformance', () => ({
  useAcsPerformance: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockAcsCode = {
  code: 'PA.I.A.K1',
  title: 'Pilot qualifications',
  type: 'knowledge' as const,
  area: 'Preflight Procedures',
  task: 'Preflight Inspection',
  shortDescription: 'Knowledge of pilot qualifications and currency requirements',
  description: 'The applicant demonstrates understanding of pilot qualifications and currency requirements.',
  slug: 'pa-i-a-k1',
  tags: ['preflight', 'qualifications'],
  related: [],
};

const mockPerformanceData = {
  acsCode: 'PA.I.A.K1',
  missRate: 23,
  averageScore: 77,
  commonMistakes: ['Incomplete fuel system inspection', 'Missing engine oil level check'],
  sampleSize: 1500,
  lastUpdated: new Date().toISOString(),
  difficulty: 'medium' as const,
};

describe('AcsActionButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state when user is not loaded', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: false,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    render(<AcsActionButtons code={mockAcsCode} />);

    // Check for loading skeleton by class names
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('renders AKTR upload link for unauthenticated users', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: mockPerformanceData,
      loading: false,
      error: null,
    });

    render(<AcsActionButtons code={mockAcsCode} />);

    const uploadLink = screen.getByText('Upload AKTR');
    expect(uploadLink).toBeInTheDocument();
    expect(uploadLink.closest('a')).toHaveAttribute('href', '/tools/aktr-to-acs');
  });

  test('renders sign in prompt for study plan when unauthenticated', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: mockPerformanceData,
      loading: false,
      error: null,
    });

    render(<AcsActionButtons code={mockAcsCode} />);

    const studyPlanButton = screen.getByText('Generate Study Plan');
    expect(studyPlanButton).toBeInTheDocument();
    expect(screen.getByText('Sign in to create personalized plans')).toBeInTheDocument();
  });

  test('renders performance data correctly', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: { id: 'user123' },
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: mockPerformanceData,
      loading: false,
      error: null,
    });

    render(<AcsActionButtons code={mockAcsCode} />);

    expect(screen.getByText('National Performance Data')).toBeInTheDocument();
    expect(screen.getByText('23% miss rate • Avg score: 77%')).toBeInTheDocument();
    expect(screen.getByText('Incomplete fuel system inspection')).toBeInTheDocument();
  });

  test('handles study plan generation for authenticated users', async () => {
    const mockUser = { id: 'user123' };
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: mockPerformanceData,
      loading: false,
      error: null,
    });

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        studyPlan: { id: 'plan123' },
      }),
    });

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<AcsActionButtons code={mockAcsCode} />);

    const generateButton = screen.getByRole('button', { name: /generate study plan/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/study/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acsCode: 'PA.I.A.K1',
          focusArea: 'knowledge',
          difficulty: 'adaptive',
        }),
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard?tab=study-plan&generated=true');
    });
  });

  test('shows appropriate difficulty colors for performance data', () => {
    const hardPerformanceData = {
      ...mockPerformanceData,
      difficulty: 'hard' as const,
      missRate: 45,
      averageScore: 65,
    };

    (useUser as jest.Mock).mockReturnValue({
      user: { id: 'user123' },
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: hardPerformanceData,
      loading: false,
      error: null,
    });

    render(<AcsActionButtons code={mockAcsCode} />);

    // Find the outer performance container div
    const performanceSection = screen.getByText('National Performance Data').closest('.border-red-200');
    expect(performanceSection).toBeInTheDocument();
  });

  test('handles API errors gracefully during study plan generation', async () => {
    const mockUser = { id: 'user123' };
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: mockPerformanceData,
      loading: false,
      error: null,
    });

    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<AcsActionButtons code={mockAcsCode} />);

    const generateButton = screen.getByRole('button', { name: /generate study plan/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error generating study plan:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('meets accessibility requirements', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: { id: 'user123' },
      isLoaded: true,
    });

    (useAcsPerformance as jest.Mock).mockReturnValue({
      data: mockPerformanceData,
      loading: false,
      error: null,
    });

    render(<AcsActionButtons code={mockAcsCode} />);

    // Check for proper headings
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Training Actions');

    // Check for proper button labeling - Button component renders as button
    const generateButton = screen.getByRole('button', { name: /generate study plan/i });
    expect(generateButton).toBeInTheDocument();

    // Check for proper link labeling
    const uploadLink = screen.getByText('Upload AKTR').closest('a');
    expect(uploadLink).toHaveAttribute('href', '/tools/aktr-to-acs');
  });
});