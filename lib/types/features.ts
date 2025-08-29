export interface FeatureScreenshot {
  featureId: string;
  url: string;
  alt: string;
  aspectRatio?: number;
}

export interface FeatureVideo {
  featureId: string;
  url: string;
  title: string;
  duration?: number;
  thumbnail?: string;
}

export interface FeaturePreviewData {
  id: string;
  name: string;
  description: string;
  screenshot: FeatureScreenshot;
  video: FeatureVideo;
  category?: string;
}

// Feature spotlight menu extensions
export interface EnhancedFeatureItem {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  previewData?: FeaturePreviewData;
}

// Screenshot preview component props
export interface ScreenshotPreviewProps {
  featureId: string;
  featureName: string;
  screenshotUrl: string;
  isVisible: boolean;
  onPlayClick: (featureId: string) => void;
  onClose: () => void;
  className?: string;
}

// Loading states
export interface PreviewLoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}