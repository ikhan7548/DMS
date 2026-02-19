import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
