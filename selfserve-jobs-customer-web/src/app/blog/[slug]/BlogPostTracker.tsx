'use client';

import { useEffect, useRef } from 'react';
import { trackBlogView, trackBlogLinkClick } from '@/lib/api';

interface ViewTrackerProps {
  postCode: string;
  type: 'view';
}

interface LinkTrackerProps {
  postCode: string;
  type: 'link';
  children: React.ReactNode;
}

type Props = ViewTrackerProps | LinkTrackerProps;

const VIEW_STORAGE_KEY = 'hirebridge_blog_views';

function hasViewedRecently(postCode: string): boolean {
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    return viewed.includes(postCode);
  } catch {
    return false;
  }
}

function markViewed(postCode: string): void {
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    if (!viewed.includes(postCode)) {
      viewed.push(postCode);
      sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(viewed));
    }
  } catch {
    // ignore
  }
}

export default function BlogPostTracker(props: Props) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (props.type !== 'view') return;
    if (trackedRef.current) return;
    trackedRef.current = true;

    if (!hasViewedRecently(props.postCode)) {
      markViewed(props.postCode);
      trackBlogView(props.postCode).catch(() => {});
    }
  }, [props]);

  if (props.type === 'link') {
    return (
      <span
        onClick={() => {
          trackBlogLinkClick(props.postCode).catch(() => {});
        }}
      >
        {props.children}
      </span>
    );
  }

  return null;
}
