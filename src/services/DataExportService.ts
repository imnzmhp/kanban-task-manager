/**
 * DataExportService - Export/Import functionality for task data
 * Allows users to backup and transfer data between devices/browsers
 */

import { Task, StoredData } from '../types/Task';
import { LocalStorageService } from './LocalStorageService';

export class DataExportService {
  /**
   * Export all tasks as JSON file
   */
  static exportTasksAsFile(): void {
    try {
      const tasks = LocalStorageService.loadTasks();
      const exportData: StoredData = {
        tasks,
        version: '1.0.0',
        lastSaved: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanban-tasks-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      throw new Error('データのエクスポートに失敗しました: ' + (error as Error).message);
    }
  }

  /**
   * Import tasks from JSON file
   */
  static importTasksFromFile(): Promise<number> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event) => {
        try {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('ファイルが選択されませんでした'));
            return;
          }

          const text = await file.text();
          const importData = JSON.parse(text) as StoredData;
          
          // Validate imported data
          if (!importData.tasks || !Array.isArray(importData.tasks)) {
            reject(new Error('無効なファイル形式です'));
            return;
          }

          // Convert dates and save
          const tasks: Task[] = importData.tasks.map(task => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
          }));

          LocalStorageService.saveTasks(tasks);
          resolve(tasks.length);
          
        } catch (error) {
          reject(new Error('ファイルの読み込みに失敗しました: ' + (error as Error).message));
        }
      };
      
      input.click();
    });
  }

  /**
   * Get export data as text (for copying)
   */
  static getExportText(): string {
    const tasks = LocalStorageService.loadTasks();
    const exportData: StoredData = {
      tasks,
      version: '1.0.0',
      lastSaved: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import tasks from text (for pasting)
   */
  static importFromText(jsonText: string): number {
    try {
      const importData = JSON.parse(jsonText) as StoredData;
      
      if (!importData.tasks || !Array.isArray(importData.tasks)) {
        throw new Error('無効なデータ形式です');
      }

      const tasks: Task[] = importData.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }));

      LocalStorageService.saveTasks(tasks);
      return tasks.length;
      
    } catch (error) {
      throw new Error('データの読み込みに失敗しました: ' + (error as Error).message);
    }
  }
}