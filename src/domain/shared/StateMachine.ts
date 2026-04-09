/**
 * StateMachine — generic state machine dùng chung.
 * Pure TypeScript, không phụ thuộc React hay Supabase.
 */

export type TransitionMap<
  TStatus extends string,
  TTransition extends string,
> = {
  [S in TStatus]: TTransition[];
};

export type TransitionResult<
  TStatus extends string,
  TTransition extends string,
> = {
  [T in TTransition]: TStatus;
};

export class StateMachine<TStatus extends string, TTransition extends string> {
  constructor(
    private readonly allowed: TransitionMap<TStatus, TTransition>,
    private readonly result: TransitionResult<TStatus, TTransition>,
  ) {}

  canTransition(from: TStatus, transition: TTransition): boolean {
    return this.allowed[from].includes(transition);
  }

  apply(from: TStatus, transition: TTransition): TStatus {
    if (!this.canTransition(from, transition)) {
      throw new Error(
        `Không thể thực hiện "${transition}" từ trạng thái "${from}"`,
      );
    }
    return this.result[transition];
  }

  allowedTransitions(from: TStatus): TTransition[] {
    return [...this.allowed[from]];
  }
}
