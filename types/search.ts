export interface ActorSearchResult {
  id: number;
  name: string;
  profilePath: string | null;
  /** Human label, e.g. "Actor", "Director". */
  profession: string;
  /** Up to 3 titles the person is known for. */
  knownFor: string[];
}
