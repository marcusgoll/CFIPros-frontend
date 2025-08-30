import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FileUploader } from '@/components/forms/FileUploader';

// Mock the analytics module with proper functions
jest.mock('@/lib/analytics/telemetry', () => ({
  trackUploadStarted: jest.fn(),
  trackFileAdded: jest.fn(),
  trackFileRemoved: jest.fn(),
  trackValidationError: jest.fn(),
}));

describe('FileUploader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File(['test content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const validPdfFile = createMockFile('test.pdf', 5 * 1024 * 1024, 'application/pdf');
  const validJpgFile = createMockFile('test.jpg', 2 * 1024 * 1024, 'image/jpeg');
  const validPngFile = createMockFile('test.png', 3 * 1024 * 1024, 'image/png');
  const invalidFile = createMockFile('test.txt', 1024, 'text/plain');
  const oversizedFile = createMockFile('large.pdf', 15 * 1024 * 1024, 'application/pdf');

  it('renders file upload interface with proper accessibility attributes', () => {
    render(<FileUploader onFilesChange={jest.fn()} />);
    
    // Check for main dropzone button
    const dropzone = screen.getByRole('button');
    expect(dropzone).toBeInTheDocument();
    expect(dropzone).toHaveAttribute('aria-label', 'Click to browse files or drag and drop files here');
    
    // Check for file input with proper accessibility
    const fileInput = screen.getByLabelText(/file upload input for knowledge test reports/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    
    // Check for instructions
    expect(screen.getByText(/drag.*drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
    
    // Check file type restrictions
    expect(screen.getByText(/pdf.*jpg.*png/i)).toBeInTheDocument();
    
    // Check file size limit
    expect(screen.getByText(/10\.0 mb/i)).toBeInTheDocument();
    
    // Check file count limit
    expect(screen.getByText(/maximum.*5.*files/i)).toBeInTheDocument();
  });

  it('accepts valid files through file input', async () => {
    const user = userEvent.setup();
    const onFilesChange = jest.fn();
    
    render(<FileUploader onFilesChange={onFilesChange} />);
    
    // Find file input
    const fileInput = screen.getByLabelText(/file upload input for knowledge test reports/i);
    
    await act(async () => {
      await user.upload(fileInput, [validPdfFile, validPngFile]);
    });

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalledWith([validPdfFile, validPngFile]);
    });
  });

  it('rejects invalid file types with clear error messages', async () => {
    const user = userEvent.setup();
    const onFilesChange = jest.fn();
    
    render(<FileUploader onFilesChange={onFilesChange} />);
    
    const fileInput = screen.getByLabelText(/file upload input for knowledge test reports/i);
    
    await act(async () => {
      await user.upload(fileInput, [invalidFile]);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/only pdf.*jpg.*png files are allowed/i);
    });
    
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it('rejects oversized files with clear error messages', async () => {
    const user = userEvent.setup();
    const onFilesChange = jest.fn();
    
    render(<FileUploader onFilesChange={onFilesChange} />);
    
    const fileInput = screen.getByLabelText(/file upload input for knowledge test reports/i);
    
    await act(async () => {
      await user.upload(fileInput, [oversizedFile]);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/each file must be less than 10mb/i);
    });
    
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it('rejects more than 5 files with clear error message', async () => {
    const user = userEvent.setup();
    const onFilesChange = jest.fn();
    
    const sixFiles = Array.from({ length: 6 }, (_, i) => 
      createMockFile(`test${i}.pdf`, 1024 * 1024, 'application/pdf')
    );
    
    render(<FileUploader onFilesChange={onFilesChange} />);
    
    const fileInput = screen.getByLabelText(/file upload input for knowledge test reports/i);
    
    await act(async () => {
      await user.upload(fileInput, sixFiles);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/maximum.*5.*files.*allowed/i);
    });
    
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it('shows loading state during file processing', () => {
    render(<FileUploader onFilesChange={jest.fn()} loading />);
    
    expect(screen.getByText(/processing files/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file processing progress/i)).toBeInTheDocument();
    
    // Dropzone button should be disabled during loading
    const dropzone = screen.getByRole('button');
    expect(dropzone).toBeDisabled();
  });

  it('displays uploaded files with remove option', async () => {
    const user = userEvent.setup();
    const onFilesChange = jest.fn();
    
    render(<FileUploader onFilesChange={onFilesChange} files={[validPdfFile, validJpgFile]} />);
    
    // Check file list is displayed
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
    
    // Check file sizes are displayed
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    
    // Check remove buttons
    const removeButtons = screen.getAllByLabelText(/remove.*file/i);
    expect(removeButtons).toHaveLength(2);
    
    // Test removing a file
    await act(async () => {
      await user.click(removeButtons[0]);
    });
    
    expect(onFilesChange).toHaveBeenCalledWith([validJpgFile]);
  });

  it('provides keyboard navigation support', async () => {
    const user = userEvent.setup();
    const onFilesChange = jest.fn();
    
    render(<FileUploader onFilesChange={onFilesChange} />);
    
    const dropzone = screen.getByRole('button');
    
    // Test keyboard activation
    await act(async () => {
      dropzone.focus();
    });
    
    expect(dropzone).toHaveFocus();
    
    await act(async () => {
      await user.keyboard('{Enter}');
    });
    
    // Verify dropzone is interactive
    expect(dropzone).toHaveFocus();
  });

  it('announces drag and drop states to screen readers', () => {
    const onFilesChange = jest.fn();
    
    render(<FileUploader onFilesChange={onFilesChange} />);
    
    const dropzoneContainer = screen.getByRole('button').parentElement;
    
    // Test drag enter
    act(() => {
      fireEvent.dragEnter(dropzoneContainer!, {
        dataTransfer: {
          files: [validPdfFile],
          types: ['Files'],
        },
      });
    });
    
    expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
    
    // Test drag leave
    act(() => {
      fireEvent.dragLeave(dropzoneContainer!);
    });
    
    expect(screen.getByText(/drag.*drop files here/i)).toBeInTheDocument();
  });

  it('shows progress for individual files when uploading', () => {
    const files = [validPdfFile, validJpgFile];
    const progress = [
      { file: validPdfFile, progress: 45, status: 'uploading' as const },
      { file: validJpgFile, progress: 80, status: 'uploading' as const },
    ];
    
    render(
      <FileUploader 
        onFilesChange={jest.fn()} 
        files={files} 
        uploadProgress={progress}
        loading 
      />
    );
    
    // Check progress percentages are displayed
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    
    // Check progress bars have proper ARIA attributes
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(2); // At least 2 file progress bars + optional general progress
    
    // Find the file-specific progress bars
    const fileProgressBars = progressBars.filter(bar => 
      bar.getAttribute('aria-label')?.includes('Upload progress for')
    );
    expect(fileProgressBars).toHaveLength(2);
    expect(fileProgressBars[0]).toHaveAttribute('aria-valuenow', '45');
    expect(fileProgressBars[1]).toHaveAttribute('aria-valuenow', '80');
  });

  it('handles upload errors gracefully', () => {
    const files = [validPdfFile, validJpgFile];
    const progress = [
      { file: validPdfFile, progress: 100, status: 'complete' as const },
      { file: validJpgFile, progress: 50, status: 'error' as const, error: 'Upload failed' },
    ];
    
    render(
      <FileUploader 
        onFilesChange={jest.fn()} 
        files={files} 
        uploadProgress={progress}
      />
    );
    
    // Check success state
    expect(screen.getByLabelText(/upload complete/i)).toBeInTheDocument();
    
    // Check error state
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload error/i)).toBeInTheDocument();
  });

  it('supports progressive enhancement without JavaScript', () => {
    render(<FileUploader onFilesChange={jest.fn()} />);
    
    // Should render a file input that works without JS
    const fileInput = screen.getByLabelText(/file upload input for knowledge test reports/i);
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('accept');
    expect(fileInput.getAttribute('accept')).toContain('pdf');
    expect(fileInput.getAttribute('accept')).toContain('jpeg');
    expect(fileInput.getAttribute('accept')).toContain('png');
  });

  it('meets accessibility requirements', () => {
    const { container } = render(<FileUploader onFilesChange={jest.fn()} />);
    
    // Check for proper ARIA labels and roles
    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('aria-label');
    
    // Check for proper form associations
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('aria-describedby');
    
    // Check color contrast is maintained through proper classes
    expect(dropzone.parentElement).toHaveClass('border-2'); // Ensures visible border
  });
});