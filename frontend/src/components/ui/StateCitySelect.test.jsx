import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StateCitySelect from './StateCitySelect';
import { fetchStates, fetchCities } from '../../data/indiaGeo';

// The real dataset, not a stub — these assertions are as much about the shipped
// indiaGeo.json being correct as about the component.
describe('indiaGeo dataset', () => {
  it('covers all 36 states and union territories', async () => {
    const states = await fetchStates();
    expect(states).toHaveLength(36);
    expect(states.map((s) => s.name)).toContain('Madhya Pradesh');
  });

  it('resolves the cities the client named in his feedback', async () => {
    const mp = await fetchCities('Madhya Pradesh');
    expect(mp).toEqual(expect.arrayContaining(['Indore', 'Bhopal']));
  });

  it('returns an empty list for an unknown state rather than throwing', async () => {
    expect(await fetchCities('Atlantis')).toEqual([]);
    expect(await fetchCities('')).toEqual([]);
  });
});

describe('StateCitySelect', () => {
  it('populates cities for the selected state', async () => {
    const onChange = vi.fn();
    render(<StateCitySelect state="Madhya Pradesh" city="" onChange={onChange} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'Indore' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Indore' } });
    expect(onChange).toHaveBeenCalledWith({ state: 'Madhya Pradesh', city: 'Indore' });
  });

  it('clears the city when the state changes', async () => {
    const onChange = vi.fn();
    render(<StateCitySelect state="Madhya Pradesh" city="Indore" onChange={onChange} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'Kerala' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Kerala' } });
    // Indore is not in Kerala — carrying it over would persist an impossible pair.
    expect(onChange).toHaveBeenCalledWith({ state: 'Kerala', city: '' });
  });

  it('keeps a stored value the dataset does not know, so saving cannot wipe it', async () => {
    render(<StateCitySelect state="Madhya Pradesh" city="Nowheresville" onChange={vi.fn()} />);

    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'Nowheresville (not in list)' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('City')).toHaveValue('Nowheresville');
  });

  it('disables the city field until a state is chosen', async () => {
    render(<StateCitySelect state="" city="" onChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('State')).toBeEnabled());
    expect(screen.getByLabelText('City')).toBeDisabled();
  });
});
