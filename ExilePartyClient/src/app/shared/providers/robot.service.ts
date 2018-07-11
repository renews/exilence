import { Injectable } from '@angular/core';

import { BehaviorSubject } from '../../../../node_modules/rxjs/internal/BehaviorSubject';
import { Keys } from '../interfaces/key.interface';
import { ElectronService } from './electron.service';
import { LogService } from './log.service';

@Injectable()
export class RobotService {

  private user32 = new this.electronService.ffi.Library('user32', {
    'GetTopWindow': ['long', ['long']],
    'FindWindowA': ['long', ['string', 'string']],
    'SetActiveWindow': ['long', ['long']],
    'SetForegroundWindow': ['bool', ['long']],
    'BringWindowToTop': ['bool', ['long']],
    'ShowWindow': ['bool', ['long', 'int']],
    'SwitchToThisWindow': ['void', ['long', 'bool']],
    'GetForegroundWindow': ['long', []],
    'AttachThreadInput': ['bool', ['int', 'long', 'bool']],
    'GetWindowThreadProcessId': ['int', ['long', 'int']],
    'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
    'SetFocus': ['long', ['long']]
  });

  private kernel32 = new this.electronService.ffi.Library('Kernel32.dll', {
    'GetCurrentThreadId': ['int', []]
  });

  private keyboard: any;
  private clipboard: any;
  private window: any;

  // private activeWindowTitle: string;
  // private activeWindow: any;
  private clipboardValue: string;

  public pressedKeysList: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

  constructor(
    private electronService: ElectronService,
    private logService: LogService
  ) {
    this.keyboard = this.electronService.robot.Keyboard;
    this.clipboard = this.electronService.robot.Clipboard;
    this.window = this.electronService.robot.Window;

    this.Initialize();
    setInterval(() => this.robotHearbeat(), 100);
  }

  private Initialize() {
    if (this.clipboard.hasText()) {
      this.clipboardValue = this.clipboard.getText();
    }

  }

  private robotHearbeat() {

    // Clipboard
    if (this.clipboard.hasText()) {
      const clip = this.clipboard.getText();
      if (clip !== this.clipboardValue) {
        this.clipboardValue = this.clipboard.getText();
      }
    }

    // Keyboard
    const keyState = this.keyboard.getState();
    const tempPressedKeys = [];
    for (const key of Object.keys(Keys)) {
      const pressed = keyState[key];
      if (pressed) {
        tempPressedKeys.unshift(+key);
      }
    }
    if (tempPressedKeys.length >= 2) {
      this.pressedKeysList.next(tempPressedKeys);
    }

    // // Window
    // this.activeWindow = this.window.getActive();
    // this.activeWindowTitle = this.activeWindow.getTitle();

  }

  private focusWindowForInput(windowTitle: String) {

    const winToSetOnTop = this.user32.FindWindowA(null, windowTitle);
    const foregroundHWnd = this.user32.GetForegroundWindow();
    const currentThreadId = this.kernel32.GetCurrentThreadId();
    const windowThreadProcessId = this.user32.GetWindowThreadProcessId(foregroundHWnd, null);
    const showWindow = this.user32.ShowWindow(winToSetOnTop, 9);
    const setWindowPos1 = this.user32.SetWindowPos(winToSetOnTop, -1, 0, 0, 0, 0, 3);
    const setWindowPos2 = this.user32.SetWindowPos(winToSetOnTop, -2, 0, 0, 0, 0, 3);
    const setForegroundWindow = this.user32.SetForegroundWindow(winToSetOnTop);
    const attachThreadInput = this.user32.AttachThreadInput(windowThreadProcessId, currentThreadId, 0);
    const setFocus = this.user32.SetFocus(winToSetOnTop);
    const setActiveWindow = this.user32.SetActiveWindow(winToSetOnTop);

    return setForegroundWindow;
  }

  public sendTextToPathWindow(text: string): boolean {

    const isWindowActive = this.focusWindowForInput('Path of Exile');
    if (isWindowActive) {
      const keyboard = this.keyboard();

      keyboard.autoDelay.min = 0;
      keyboard.autoDelay.max = 0;
      keyboard.click(Keys.Enter);
      keyboard.click(this.prepareStringForRobot(text));
      keyboard.click(Keys.Enter);
      return true;
    }
    this.logService.log('Could not send text to path window: ', text, true);
    return false;
  }

  private prepareStringForRobot(string: string) {
    string = string.split('_').join('+-');
    string = string.split('@').join('%^2');
    string = string.split('!').join('+1');
    string = string.split('(').join('+8');
    string = string.split(')').join('+9');
    string = string.split('"').join('+2');
    string = string.split(';').join('+{COMMA}');
    string = string.split(',').join('{COMMA}');
    string = string.split(':').join('+{PERIOD}');
    string = string.split('.').join('{PERIOD}');
    string = string.split('~').join('-');
    string = string.split('/').join('+7');
    return string;
  }

  public setTextToClipboard(text: string) {
    this.clipboard.setText(text);
  }

}