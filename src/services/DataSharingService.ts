/**
 * DataSharingService - URL-based data sharing functionality
 * Allows sharing task data via URL parameters (limited by URL length)
 */

import { Task } from '../types/Task';
import { LocalStorageService } from './LocalStorageService';

export class DataSharingService {
  /**
   * Generate shareable URL with task data
   * Note: Limited by browser URL length (~2083 characters)
   */
  static generateShareableURL(): string {
    try {
      const tasks = LocalStorageService.loadTasks();
      
      // Create compressed data structure
      const shareData = {
        t: tasks.map(task => ({
          i: task.id,
          tt: task.title,
          d: task.description,
          s: task.status,
          c: task.createdAt.getTime(),
          u: task.updatedAt.getTime()
        })),
        v: '1.0'
      };

      const dataStr = JSON.stringify(shareData);
      const encodedData = encodeURIComponent(btoa(dataStr));
      
      const baseURL = window.location.origin + window.location.pathname;
      const shareURL = `${baseURL}?data=${encodedData}`;
      
      // Check URL length limit
      if (shareURL.length > 2000) {
        throw new Error('データが大きすぎてURL共有できません（タスク数を減らしてください）');
      }
      
      return shareURL;
      
    } catch (error) {
      throw new Error('共有URLの生成に失敗しました: ' + (error as Error).message);
    }
  }

  /**
   * Load tasks from URL parameters
   */
  static loadFromURL(): Task[] | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      
      if (!dataParam) {
        return null;
      }

      const decodedData = atob(decodeURIComponent(dataParam));
      const shareData = JSON.parse(decodedData);
      
      if (!shareData.t || !Array.isArray(shareData.t)) {
        throw new Error('無効な共有データ形式');
      }

      // Convert compressed format back to full Task objects
      const tasks: Task[] = shareData.t.map((t: any) => ({
        id: t.i,
        title: t.tt,
        description: t.d,
        status: t.s,
        createdAt: new Date(t.c),
        updatedAt: new Date(t.u)
      }));

      return tasks;
      
    } catch (error) {
      console.error('URL からのデータ読み込みに失敗:', error);
      return null;
    }
  }

  /**
   * Copy shareable URL to clipboard
   */
  static async copyShareableURL(): Promise<void> {
    try {
      const shareURL = DataSharingService.generateShareableURL();
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareURL);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareURL;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
    } catch (error) {
      throw new Error('URLのコピーに失敗しました: ' + (error as Error).message);
    }
  }

  /**
   * Clear URL parameters after loading data
   */
  static clearURLParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('data');
    window.history.replaceState({}, document.title, url.toString());
  }
}