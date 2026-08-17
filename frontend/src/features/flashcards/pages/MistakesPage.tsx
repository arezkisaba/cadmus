import { MissedCards } from '../components/MissedCards';

export const MistakesPage: React.FC = () => (
    <div className="flex flex-col gap-6">
        <div>
            <h2 className="text-2xl font-semibold tracking-tight">Missed</h2>
            <p className="text-muted-foreground text-sm">Cards you missed in their last session, grouped by category.</p>
        </div>
        <MissedCards />
    </div>
);
