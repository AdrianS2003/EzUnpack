import { Circle, Path, Rect, Svg } from 'react-native-svg';

/**
 * The prototype's line icons, ported one-for-one. Everything is drawn on a
 * 24x24 grid with a heavy stroke so the shapes survive at large sizes.
 */
export type IconName =
  | 'archive'
  | 'archive-down'
  | 'folder-check'
  | 'search'
  | 'mic'
  | 'download'
  | 'home'
  | 'video'
  | 'settings'
  | 'info'
  | 'help'
  | 'check'
  | 'close'
  | 'play'
  | 'send';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const BOX = 'M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8';

export function Icon({ name, size = 24, color, strokeWidth = 2.2 }: Props) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'archive' && (
        <>
          <Path d={BOX} {...stroke} />
          <Rect x={2} y={3} width={20} height={5} rx={1} {...stroke} />
          <Path d="M10 12h4" {...stroke} />
        </>
      )}
      {name === 'archive-down' && (
        <>
          <Path d={BOX} {...stroke} />
          <Rect x={2} y={3} width={20} height={5} rx={1} {...stroke} />
          <Path d="M12 12v6M9 15l3 3 3-3" {...stroke} />
        </>
      )}
      {name === 'folder-check' && (
        <>
          <Path d="M4 6a2 2 0 0 1 2-2h3l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" {...stroke} />
          <Path d="m9 13 2 2 4-4" {...stroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="m20 20-4.3-4.3" {...stroke} />
        </>
      )}
      {name === 'mic' && (
        <>
          <Rect x={9} y={2} width={6} height={11} rx={3} {...stroke} />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...stroke} />
        </>
      )}
      {name === 'download' && (
        <>
          <Path d="M12 3v10m0 0 4-4m-4 4-4-4" {...stroke} />
          <Path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" {...stroke} />
        </>
      )}
      {name === 'home' && (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...stroke} />
          <Path d="M5 10v10h14V10" {...stroke} />
        </>
      )}
      {name === 'video' && (
        <>
          <Rect x={2} y={5} width={14} height={14} rx={3} {...stroke} />
          <Path d="m16 12 6-4v8z" {...stroke} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx={12} cy={12} r={3} {...stroke} />
          <Path
            d="M4 12h2m12 0h2M12 4v2m0 12v2M6.5 6.5 8 8m8 8 1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5"
            {...stroke}
          />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Circle cx={12} cy={8} r={1} fill={color} />
          <Path d="M11 12h1v4h1" {...stroke} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.3" {...stroke} />
          <Circle cx={12} cy={17} r={1} fill={color} />
        </>
      )}
      {name === 'check' && <Path d="m4 13 5 5L20 7" {...stroke} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...stroke} />}
      {name === 'play' && <Path d="M8 5v14l11-7z" fill={color} />}
      {name === 'send' && (
        <>
          <Path d="M12 20V5m0 0-6 6m6-6 6 6" {...stroke} />
          <Path d="M4 3h16" {...stroke} />
        </>
      )}
    </Svg>
  );
}
