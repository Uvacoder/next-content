import { QueryClient } from './lib/query-client';
import { FetchResult } from './lib/query-server';
import React, { useContext } from 'react';

export interface ContentProviderProps {
  contents: FetchResult[] | undefined;
}

export const ContentContext = React.createContext<ContentProviderProps>({
  contents: undefined,
});

export const ContentProvider: React.FC<ContentProviderProps> = ({
  contents,
  children,
}) => {
  if (!contents) return <>{children}</>;
  else
    return <ContentContext.Provider value={{ contents }} children={children} />;
};

export const useContentQuery = <T extends {}>(
  Contents: ContentProviderProps['contents']
) => {
  const contents = (useContext(ContentContext).contents ||
    Contents) as FetchResult<T>[];

  return new QueryClient(contents);
};
