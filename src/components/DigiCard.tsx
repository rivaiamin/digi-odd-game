import {useRef, useState, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {Text, Image, Float, useCursor} from '@react-three/drei';
import * as THREE from 'three';
import {useSpring, animated} from '@react-spring/three';

interface DigiCardProps {
  position: [number, number, number];
  name: string;
  image: string;
  isFlipped: boolean;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed?: boolean;
  onClick: () => void;
}

export const DigiCard = ({
  position,
  name,
  image,
  isFlipped,
  isSelected,
  isCorrect,
  isRevealed,
  onClick
}: DigiCardProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const {rotateY, zPos, lift} = useSpring({
    rotateY: isFlipped ? 0 : Math.PI,
    zPos: isSelected ? 0.5 : 0,
    lift: hovered ? 0.2 : 0,
    config: {mass: 5, tension: 400, friction: 50},
  });

  // 2.5D Parallax effect
  useFrame((state) => {
    if (!meshRef.current || !isFlipped) return;
    
    // Smooth tilt towards mouse
    const x = (state.mouse.x * 0.2);
    const y = (state.mouse.y * 0.2);
    
    if (hovered) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x + rotateY.get(), 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -y, 0.1);
    } else {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotateY.get(), 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
    }
  });

  const cardWidth = 2.4;
  const cardHeight = 3.4;

  const getBorderColor = () => {
    if (isRevealed) {
      return isCorrect ? '#00f2ff' : '#ff007a';
    }
    return isSelected ? '#ff9d00' : 'rgba(0, 242, 255, 0.4)';
  };

  const getShadowColor = () => {
    if (isRevealed) {
      return isCorrect ? '#00f2ff' : '#ff007a';
    }
    return isSelected ? '#ff9d00' : 'transparent';
  };

  return (
    <animated.group
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
      position-z={zPos}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Front Face */}
      <group>
        {/* Border (Transparent background for holographic effect) */}
        <mesh>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshStandardMaterial 
            color={getBorderColor()} 
            metalness={0.9} 
            roughness={0.1} 
            transparent 
            opacity={isRevealed && !isCorrect ? 0.2 : 0.8}
            emissive={getBorderColor()}
            emissiveIntensity={isSelected || (isRevealed && isCorrect) ? 1.5 : 0.2}
          />
        </mesh>
        
        {/* Inner Art Background Gradient */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[cardWidth * 0.92, cardHeight * 0.92]} />
          <meshStandardMaterial color="#0a0f19" opacity={0.9} transparent />
        </mesh>

        {/* Card Art Container (Design gradient) */}
        <mesh position={[0, 0.4, 0.02]}>
          <planeGeometry args={[cardWidth * 0.85, cardHeight * 0.55]} />
          <meshStandardMaterial 
            color="#1a1c2c" 
            emissive="#0044ff"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Hologram/Scanlines effect on art */}
        <mesh position={[0, 0.4, 0.021]}>
          <planeGeometry args={[cardWidth * 0.85, cardHeight * 0.55]} />
          <meshStandardMaterial 
            color="#00f2ff" 
            transparent 
            opacity={0.05} 
            wireframe
          />
        </mesh>

        {/* Digimon Image */}
        <Image
          url={image}
          scale={[cardWidth * 0.75, cardHeight * 0.5]}
          position={[0, 0.4, 0.05]}
          transparent
          opacity={isRevealed && !isCorrect ? 0.2 : 1}
        />

        {/* Digimon Name */}
        <Text
          position={[0, -0.6, 0.05]}
          fontSize={0.22}
          color={isSelected ? "#ff9d00" : "white"}
          maxWidth={cardWidth * 0.8}
          textAlign="center"
          anchorY="middle"
        >
          {name.toUpperCase()}
        </Text>

        {/* Technical Badges (Stat Badges from design) */}
        <group position={[0, -1.1, 0.05]}>
          <Text
            position={[-0.5, 0, 0]}
            fontSize={0.08}
            color="#00f2ff"
            anchorX="center"
          >
            [ TYPE_V1 ]
          </Text>
          <Text
            position={[0.5, 0, 0]}
            fontSize={0.08}
            color="#00f2ff"
            anchorX="center"
          >
            [ NODE_STABLE ]
          </Text>
        </group>
      </group>

      {/* Back Face (Technical Back) */}
      <group rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshStandardMaterial color="#0a0f19" />
        </mesh>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.2}
          color="#00f2ff"
          maxWidth={cardWidth * 0.8}
          textAlign="center"
        >
          ANALYZING{"\n"}DIGITAL{"\n"}SIGNATURE
        </Text>
      </group>
    </animated.group>
  );
};
