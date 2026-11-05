import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames, Skeleton, SkeletonGroup, SkeletonText, Spinner } from '../src/index';

const meta: Meta = { title: 'Display', component: Icon };
export default meta;
type Story = StoryObj;

export const IconGallery: Story = {
  render: () => (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(7rem, 1fr))',
        gap: 12,
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {iconNames.map((name) => (
        <li
          key={name}
          style={{ display: 'grid', justifyItems: 'center', gap: 4, fontSize: 12, padding: 8 }}
        >
          <Icon name={name} size="lg" />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="story-stack">
      <SkeletonGroup label="Loading messages">
        <div className="story-row">
          <Skeleton width={40} height={40} radius="999px" />
          <div style={{ flex: 1 }}>
            <SkeletonText lines={3} />
          </div>
        </div>
      </SkeletonGroup>
      <Spinner />
    </div>
  ),
};
