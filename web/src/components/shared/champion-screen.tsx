'use client';

import { useEffect, useState } from 'react';
import { Standing } from '@/types';
import { Trophy, Medal } from 'lucide-react';
import { AvatarWithInitials } from '@/components/ui/avatar';

interface ChampionScreenProps {
  standings: Standing[];
}

export function ChampionScreen({ standings }: ChampionScreenProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number }>>([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
    }));
    setConfetti(particles);
  }, []);

  const champion = standings[0];
  const runnerUp = standings[1];
  const thirdPlace = standings[2];

  if (!champion) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-yellow-950 via-background to-background flex flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Trophy Icon */}
        <div className="flex justify-center">
          <Trophy className="w-24 h-24 text-yellow-400 animate-bounce" />
        </div>

        {/* Champion Info */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Campeão!
          </h1>
          <p className="text-gray-300 text-lg">
            Parabéns pelo excelente desempenho
          </p>
        </div>

        {/* Champion Card */}
        <div className="bg-gradient-to-br from-yellow-950 to-yellow-900/50 border-2 border-yellow-500 rounded-2xl p-8 max-w-sm mx-auto shadow-2xl shadow-yellow-500/30">
          <div className="flex justify-center mb-4">
            <AvatarWithInitials
              name={champion.user.fullName}
              src={champion.user.avatarUrl}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-50">
            {champion.user.fullName}
          </h2>
          <p className="text-yellow-300 text-3xl font-bold font-mono my-2">
            {champion.points} pts
          </p>
          <p className="text-gray-400 text-sm">
            {champion.matchesCorrect}/{champion.matchesPlayed} acertos
            ({(champion.accuracy * 100).toFixed(1)}%)
          </p>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
          {/* Second Place */}
          {runnerUp && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                <Medal className="w-6 h-6 text-gray-800" />
              </div>
              <p className="font-semibold text-gray-300 text-sm">
                {runnerUp.user.fullName}
              </p>
              <p className="text-gray-400 text-xs">
                {runnerUp.points} pts
              </p>
            </div>
          )}

          {/* First Place (Champion) */}
          <div className="flex flex-col items-center space-y-2 scale-110">
            <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-950" />
            </div>
            <p className="font-bold text-yellow-300 text-sm">
              {champion.user.fullName}
            </p>
            <p className="text-yellow-300 font-bold">
              {champion.points} pts
            </p>
          </div>

          {/* Third Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                <Medal className="w-6 h-6 text-orange-950" />
              </div>
              <p className="font-semibold text-gray-300 text-sm">
                {thirdPlace.user.fullName}
              </p>
              <p className="text-gray-400 text-xs">
                {thirdPlace.points} pts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
