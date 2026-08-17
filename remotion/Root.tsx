import { Composition } from "remotion";
import { Tour, getTotalDurationInFrames } from "./Tour";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Tour"
      component={Tour}
      durationInFrames={getTotalDurationInFrames(FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
