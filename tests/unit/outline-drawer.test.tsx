import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OutlineDrawer from '../../src/renderer/components/OutlineDrawer';
import type { OutlineItem } from '../../src/renderer/utils/outline';
import type { FileTreeNode, WorkspaceFolder } from '../../src/types';

describe('Sidebar Dual-View (Folders + Outline) Component (T303 / AC-15.1 ~ AC-15.4)', () => {
  const mockOutline: OutlineItem[] = [
    { id: '1', level: 1, text: 'Title 1', line: 1, from: 0 },
    { id: '2', level: 2, text: 'Subtitle 2', line: 5, from: 40 },
  ];

  const mockFileTree: FileTreeNode[] = [
    {
      name: 'docs',
      path: '/workspace/docs',
      isDirectory: true,
      children: [
        { name: 'guide.md', path: '/workspace/docs/guide.md', isDirectory: false },
      ],
    },
    { name: 'README.md', path: '/workspace/README.md', isDirectory: false },
  ];

  const mockFolders: WorkspaceFolder[] = [
    {
      id: '/workspace/project-a',
      name: 'Project A',
      path: '/workspace/project-a',
      tree: [
        { name: 'intro.md', path: '/workspace/project-a/intro.md', isDirectory: false },
      ],
    },
    {
      id: '/workspace/project-b',
      name: 'Project B',
      path: '/workspace/project-b',
      tree: [
        { name: 'api.md', path: '/workspace/project-b/api.md', isDirectory: false },
      ],
    },
  ];

  it('renders outline items when open in outline view', () => {
    const handleSelect = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        onSelectHeading={handleSelect}
      />
    );

    expect(screen.getByText('Title 1')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 2')).toBeInTheDocument();
    expect(screen.getByText('2 个小节')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Subtitle 2'));
    expect(handleSelect).toHaveBeenCalledWith(mockOutline[1]);
  });

  it('switches to Folders view with "文件夹" tab and triggers onSelectFile when clicking a markdown file', () => {
    const handleSelectFile = vi.fn();
    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        fileTree={mockFileTree}
        currentFolderPath="/workspace"
        activeFilePath="/workspace/README.md"
        onSelectHeading={vi.fn()}
        onSelectFile={handleSelectFile}
      />
    );

    // 点击顶部「文件夹」Tab 切换到文件夹视图
    const filesTab = screen.getByTestId('sidebar-tab-files');
    expect(filesTab).toHaveTextContent('文件夹');
    fireEvent.click(filesTab);

    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('guide.md')).toBeInTheDocument();

    fireEvent.click(screen.getByText('guide.md'));
    expect(handleSelectFile).toHaveBeenCalledWith('/workspace/docs/guide.md');
  });

  it('renders multiple workspace folders and supports removing and adding folders', () => {
    const handleAddFolder = vi.fn();
    const handleRemoveFolder = vi.fn();
    const handleSelectFile = vi.fn();

    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        folders={mockFolders}
        onSelectHeading={vi.fn()}
        onSelectFile={handleSelectFile}
        onAddFolder={handleAddFolder}
        onRemoveFolder={handleRemoveFolder}
        defaultView="files"
      />
    );

    // 验证包含多个文件夹的标题
    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Project B')).toBeInTheDocument();
    expect(screen.getByText('intro.md')).toBeInTheDocument();
    expect(screen.getByText('api.md')).toBeInTheDocument();

    // 移除第一个文件夹
    const removeBtn0 = screen.getByTestId('remove-folder-btn-0');
    expect(removeBtn0).toBeInTheDocument();
    fireEvent.click(removeBtn0);
    expect(handleRemoveFolder).toHaveBeenCalledWith('/workspace/project-a');

    // 点击添加文件夹按钮
    const addFolderBtn = screen.getByTestId('sidebar-add-folder-btn');
    fireEvent.click(addFolderBtn);
    expect(handleAddFolder).toHaveBeenCalledTimes(1);

    // 点击底部添加文件夹按钮
    const footerAddBtn = screen.getByTestId('sidebar-footer-add-folder-btn');
    fireEvent.click(footerAddBtn);
    expect(handleAddFolder).toHaveBeenCalledTimes(2);
  });

  it('renders empty state when no workspace folders are added', () => {
    const handleAddFolder = vi.fn();

    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        folders={[]}
        onSelectHeading={vi.fn()}
        onAddFolder={handleAddFolder}
        defaultView="files"
      />
    );

    expect(screen.getByText('尚未添加工作区文件夹')).toBeInTheDocument();
    const emptyAddBtn = screen.getByTestId('sidebar-empty-add-folder-btn');
    fireEvent.click(emptyAddBtn);
    expect(handleAddFolder).toHaveBeenCalledTimes(1);
  });

  it('hides drawer when isOpen is false', () => {
    const { container } = render(
      <OutlineDrawer
        isOpen={false}
        outline={mockOutline}
        onSelectHeading={vi.fn()}
      />
    );

    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('w-0');
  });

  it('switches to Search view with "搜索" tab and renders workspace search inputs', () => {
    render(
      <OutlineDrawer
        isOpen={true}
        outline={mockOutline}
        folders={mockFolders}
        onSelectHeading={vi.fn()}
      />
    );

    const searchTab = screen.getByTestId('sidebar-tab-search');
    expect(searchTab).toHaveTextContent('搜索');
    fireEvent.click(searchTab);

    expect(screen.getByTestId('workspace-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-case-sensitive-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('search-whole-word-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-search-stats')).toHaveTextContent('输入关键词检索全工作区');
  });
});
