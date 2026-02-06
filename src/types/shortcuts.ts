export interface QuickAccessItem {
  id: string;
  name: string;
  target: string;
  kind: 'website' | 'directory';
  description?: string;
  icon?: string;
  encrypted: boolean;
  hidden: boolean;
  created_at: number;
  updated_at: number;
}

export interface CreateQuickAccessDto {
  name: string;
  target: string;
  kind: 'website' | 'directory';
  description?: string;
  icon?: string;
  encrypted: boolean;
  hidden: boolean;
}

export interface UpdateQuickAccessDto {
  name?: string;
  target?: string;
  description?: string;
  icon?: string;
  encrypted?: boolean;
  hidden?: boolean;
}

export interface WebsiteMetadata {
  title?: string;
  description?: string;
  icon?: string;
}
