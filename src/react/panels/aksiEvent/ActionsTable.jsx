import {
    PlayIcon,
    PencilSquareIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    SpeakerWaveIcon,
    ChatBubbleLeftRightIcon,
    PhotoIcon,
    BellAlertIcon,
    LinkIcon,
    KeyIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import RowIconButton from '../../components/RowIconButton.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export const BEHAVIOR_TYPE_KEYS = ['play_audio', 'tts', 'show_media', 'show_alert', 'webhook', 'keystroke', 'minecraft_command'];

export function behaviorLabel(t, type) {
    return t(`aksiEvent.behavior.${type}`);
}

const FEATURE_ICONS = [
    { type: 'play_audio', Icon: SpeakerWaveIcon },
    { type: 'tts', Icon: ChatBubbleLeftRightIcon },
    { type: 'show_media', Icon: PhotoIcon },
    { type: 'show_alert', Icon: BellAlertIcon },
    { type: 'webhook', Icon: LinkIcon },
    { type: 'keystroke', Icon: KeyIcon },
    { type: 'minecraft_command', Icon: CubeIcon },
];

export default function ActionsTable({ actions, screens, onEdit, onTest, onDuplicate, onRemove }) {
    const { t } = useLanguage();

    function screenName(screenId) {
        const screen = screens.find((s) => s.id === screenId);
        return screen ? screen.name : t('common.dash');
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.actionsTable.name')}</th>
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.actionsTable.screen')}</th>
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.actionsTable.duration')}</th>
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.actionsTable.features')}</th>
                        <th className="py-2 px-4 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {!actions.length ? (
                        <tr>
                            <td colSpan={5} className="py-6 text-center text-text-muted">
                                {t('aksiEvent.actionsTable.empty')}
                            </td>
                        </tr>
                    ) : (
                        actions.map((action) => {
                            const activeTypes = new Set(action.behaviors.map((b) => b.type));

                            return (
                                <tr key={action.id} className="border-b border-border last:border-0">
                                    <td className="py-2 px-4 font-medium">{action.name || t('aksiEvent.actionsTable.unnamed')}</td>
                                    <td className="py-2 px-4">{screenName(action.screenId)}</td>
                                    <td className="py-2 px-4">{action.durationSeconds}s</td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center gap-2">
                                            {FEATURE_ICONS.map(({ type, Icon }) => (
                                                <Icon
                                                    key={type}
                                                    title={behaviorLabel(t, type)}
                                                    className={`h-4 w-4 ${activeTypes.has(type) ? 'text-primary-600' : 'text-text-muted opacity-30'}`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <RowIconButton onClick={() => onTest(action.id)} title={t('common.test')}>
                                                <PlayIcon className="h-4 w-4" />
                                            </RowIconButton>
                                            <RowIconButton onClick={() => onEdit(action)} title={t('common.edit')}>
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </RowIconButton>
                                            <RowIconButton onClick={() => onDuplicate(action.id)} title={t('common.duplicate')}>
                                                <DocumentDuplicateIcon className="h-4 w-4" />
                                            </RowIconButton>
                                            <RowIconButton onClick={() => onRemove(action.id)} title={t('common.delete')} tone="danger">
                                                <TrashIcon className="h-4 w-4" />
                                            </RowIconButton>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
