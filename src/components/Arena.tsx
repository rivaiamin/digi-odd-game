import {Stars, Environment, MeshDistortMaterial, Float} from '@react-three/drei';

export const Arena = () => {
  return (
    <>
      <color attach="background" args={['#020617']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Ambient Lighting */}
      <ambientLight intensity={1.0} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#00f2ff" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ff007a" />

      {/* Floating Network Cubes */}
      <group>
        {Array.from({length: 12}).map((_, i) => (
          <Float key={i} speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh position={[
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 10 - 10
            ]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <MeshDistortMaterial color="#0044ff" speed={2} distort={0.3} transparent opacity={0.2} />
            </mesh>
          </Float>
        ))}
      </group>
    </>
  );
};
