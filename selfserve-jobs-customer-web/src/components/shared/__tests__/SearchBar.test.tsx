import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('renders the search input', () => {
    render(<SearchBar onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows default placeholder', () => {
    render(<SearchBar onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('shows custom placeholder', () => {
    render(<SearchBar onChange={vi.fn()} placeholder="Find jobs" />);
    expect(screen.getByPlaceholderText('Find jobs')).toBeInTheDocument();
  });

  it('initializes with the provided value', () => {
    render(<SearchBar onChange={vi.fn()} value="initial" />);
    expect(screen.getByRole('searchbox')).toHaveValue('initial');
  });

  it('calls onChange with the accumulated value on each keystroke', async () => {
    const handleChange = vi.fn();
    render(<SearchBar onChange={handleChange} />);
    await userEvent.type(screen.getByRole('searchbox'), 'hi');
    // onChange receives the full input value after each character is appended
    expect(handleChange).toHaveBeenCalledWith('h');
    expect(handleChange).toHaveBeenLastCalledWith('hi');
    expect(handleChange).toHaveBeenCalledTimes(2);
  });

  it('shows clear button when input has a value', async () => {
    render(<SearchBar onChange={vi.fn()} />);
    await userEvent.type(screen.getByRole('searchbox'), 'react');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('does not show clear button when input is empty', () => {
    render(<SearchBar onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('clears input and calls onChange("") when clear button is clicked', async () => {
    const handleChange = vi.fn();
    render(<SearchBar onChange={handleChange} />);
    await userEvent.type(screen.getByRole('searchbox'), 'hello');
    handleChange.mockClear();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('shows spinner when searching=true', () => {
    const { container } = render(<SearchBar onChange={vi.fn()} searching />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('hides clear button when searching=true (even when input has a value)', async () => {
    render(<SearchBar onChange={vi.fn()} value="test" searching />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('does not show spinner when searching is false', () => {
    const { container } = render(<SearchBar onChange={vi.fn()} searching={false} />);
    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  it('shows clear button after typing (searching=false)', async () => {
    render(<SearchBar onChange={vi.fn()} searching={false} />);
    await userEvent.type(screen.getByRole('searchbox'), 'node');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });
});
