// Filename: index.js
// Combined code from all files

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TouchableOpacity, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { Accelerometer } from 'expo-sensors';
import Matter from 'matter-js';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 20;
const CELL_SIZE = Math.floor(width / GRID_SIZE);

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const generateFood = () => {
  return {
    position: [randomBetween(0, GRID_SIZE - 1), randomBetween(0, GRID_SIZE - 1)],
    size: [CELL_SIZE, CELL_SIZE],
  };
};

const initialState = () => ({
  head: { position: [0, 0], size: [CELL_SIZE, CELL_SIZE], nextMove: [1, 0] },
  food: generateFood(),
  tail: [],
  score: 0,
  gameOver: false,
});

const snakeGameEngine = () => {
  let engine = Matter.Engine.create();
  let world = engine.world;

  const entities = {
    head: { body: Matter.Bodies.rectangle(width / 2, height / 2, CELL_SIZE, CELL_SIZE), size: [CELL_SIZE, CELL_SIZE], nextMove: [1, 0] },
    food: generateFood(),
    tail: [],
  };

  Matter.World.add(world, entities.head.body);

  Matter.Events.on(engine, 'collisionStart', (event) => {
    const { pairs } = event;
    pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      if (bodyA.label === 'snake' && bodyB.label === 'food' || bodyA.label === 'food' && bodyB.label === 'snake') {
        entities.food = generateFood();
        entities.tail.push({});
        entities.score++;
      }
    });
  });

  let lastMove = new Date().getTime();

  function update() {
    let now = new Date().getTime();
    if (now - lastMove > 200) {
      let head = entities.head;
      const newX = head.position[0] + head.nextMove[0] * CELL_SIZE;
      const newY = head.position[1] + head.nextMove[1] * CELL_SIZE;

      // Check for game-over conditions
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
        world.bodies = []; // Clear all bodies
        self.players.emit('game-over');
        return;
      }

      // Update body positions
      head.position = [newX, newY];
      lastMove = now;
    }
  }

  Matter.Events.on(engine, 'afterUpdate', update);

  return entities;
};

const Snake = (props) => {
  return (
    <View 
      style={{
        position: 'absolute',
        left: props.position[0],
        top: props.position[1],
        width: props.size[0],
        height: props.size[1],
        backgroundColor: 'green',
      }}
    />
  );
};

const Food = (props) => {
  return (
    <View 
      style={{
        position: 'absolute',
        left: props.position[0],
        top: props.position[1],
        width: props.size[0],
        height: props.size[1],
        backgroundColor: 'red',
      }}
    />
  );
};

export default function App() {
  const [running, setRunning] = useState(false);
  const [gameEngine, setGameEngine] = useState(null);
  const [score, setScore] = useState(0);

  const onEvent = useCallback((e) => {
    if (e.type === 'game-over') {
      setRunning(false);
      setScore(0);
      gameEngine.swap(snakeGameEngine());
    } else if (e.type === 'score') {
      setScore(score + 1);
    }
  }, [score]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Snake Game</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <GameEngine
        ref={(ref) => { setGameEngine(ref); }}
        style={styles.gameEngine}
        systems={[snakeGameEngine]}
        entities={snakeGameEngine()}
        running={running}
        onEvent={onEvent}
      />
      {!running && (
        <Button
          title="Start Game"
          onPress={() => {
            setRunning(true);
            gameEngine.swap(snakeGameEngine());
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 50
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
  },
  score: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  gameEngine: {
    width: 300,
    height: 300,
    backgroundColor: '#E5E5E5',
    alignSelf: 'center'
  },
});